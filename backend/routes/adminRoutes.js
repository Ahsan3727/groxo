const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary'); // ✅ Cloudinary import
const {
  login,
  me,
  dashboard,
  getUsers,
  getUserSummary,
  createUser,
  updateUser,
  deleteUser,
  getSettings,
  updateGeneralSettings,
  updateCommissionSettings,
} = require('../controllers/adminController');
// Reused as-is for the admin-namespaced assign-rider route below — this is
// the "good" rider-assignment path (sets status to confirmed, pushes a
// timeline entry, sends a push notification), shared with the non-admin
// `PUT /orders/:id/assign` route so both stay in sync with one implementation.
const { assignRider } = require('../controllers/orderController');
const generateInvoicePDF = require('../utils/generateInvoice');
const { protectAdmin } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const SupportTicket = require('../models/SupportTicket');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const AdminAuditLog = require('../models/AdminAuditLog');
const Category = require('../models/Category');
// const { parseCSV, stringifyCSV } = require('../utils/Csv');

// Separate multer instance (memory storage) for CSV import — the disk-based
// `upload` below is specifically wired for product image uploads.
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ok = /csv$/i.test(path.extname(file.originalname)) || file.mimetype === 'text/csv';
    cb(ok ? null : new Error('Only .csv files are accepted'), ok);
  },
});

// Fire-and-forget audit log write — never let a logging failure block or
// fail the admin action that triggered it.
const logAdminAction = (adminId, action, targetType, targetId, details) => {
  AdminAuditLog.create({ admin: adminId, action, targetType, targetId, details }).catch((err) =>
    console.error('Audit log write failed:', err.message)
  );
};
 
// ---------- Multer configuration (absolute path + auto-create) ----------
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
 
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
 
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('productImage');

// Same pattern as the product-image upload above, reused for banners so the
// Banners page gets a real upload flow instead of a raw-URL paste field.
const bannerUploadsDir = path.join(__dirname, '..', 'uploads', 'banners');
if (!fs.existsSync(bannerUploadsDir)) {
  fs.mkdirSync(bannerUploadsDir, { recursive: true });
}
const bannerStorage = multer.diskStorage({
  destination: bannerUploadsDir,
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const uploadBannerImage = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('bannerImage');
 
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}
 
// ---------- Auth / Admin info ----------
router.post('/login', loginLimiter, login);
router.get('/me', protectAdmin, me);
router.get('/dashboard', protectAdmin, dashboard);

// ---------- Settings ----------
router.get('/settings', protectAdmin, getSettings);
router.put('/settings/general', protectAdmin, updateGeneralSettings);
router.put('/settings/commission', protectAdmin, updateCommissionSettings);
 
// ---------- User Management ----------
router.get('/users', protectAdmin, getUsers);
router.get('/users/:id/summary', protectAdmin, getUserSummary);
router.post('/users', protectAdmin, createUser);
router.put('/users/:id', protectAdmin, updateUser);
router.delete('/users/:id', protectAdmin, deleteUser);
 
// ---------- Location Endpoints (for HubMap) ----------

// Builds a MongoDB $geoWithin polygon filter for `field` from Leaflet-style
// bounding-box query params (swLat, swLng, neLat, neLng). Returns null when
// bounds aren't supplied, so callers can fall back to an unscoped fetch
// (e.g. before the map has reported its first viewport).
const buildBoundsFilter = (field, query) => {
  const { swLat, swLng, neLat, neLng } = query;
  if ([swLat, swLng, neLat, neLng].some((v) => v === undefined || v === '' || Number.isNaN(Number(v)))) {
    return null;
  }
  const sw = [Number(swLng), Number(swLat)];
  const ne = [Number(neLng), Number(neLat)];
  return {
    [field]: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [[sw, [ne[0], sw[1]], ne, [sw[0], ne[1]], sw]],
        },
      },
    },
  };
};

// Viewing customer live location is personally sensitive, so it's audit
// logged — but not on every 5-60s poll, or the log would be pure noise.
// Rate-limited to once per admin per cooldown window instead.
const customerLocationLastLogged = new Map(); // adminId -> timestamp
const CUSTOMER_LOCATION_LOG_COOLDOWN_MS = 5 * 60 * 1000;

// Riders
router.get('/riders/locations', protectAdmin, async (req, res) => {
  try {
    const filter = { role: 'rider' };
    const boundsFilter = buildBoundsFilter('currentLocation', req.query);
    if (boundsFilter) Object.assign(filter, boundsFilter);

    const riders = await User.find(filter).select('-password');
    const riderIds = riders.map((r) => r._id);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Real status/stats, derived from actual orders — not fields the schema
    // never populates. "Busy" = currently has an order out for delivery.
    const [busyRiderIds, deliveryCounts, todayEarnings] = await Promise.all([
      Order.distinct('rider', { rider: { $in: riderIds }, status: 'out_for_delivery' }),
      Order.aggregate([
        { $match: { rider: { $in: riderIds }, status: 'delivered' } },
        { $group: { _id: '$rider', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { rider: { $in: riderIds }, status: 'delivered', updatedAt: { $gte: startOfToday } } },
        { $group: { _id: '$rider', total: { $sum: '$riderEarning' } } },
      ]),
    ]);

    const busySet = new Set(busyRiderIds.map((id) => id.toString()));
    const deliveryCountMap = new Map(deliveryCounts.map((d) => [d._id.toString(), d.count]));
    const todayEarningsMap = new Map(todayEarnings.map((e) => [e._id.toString(), e.total]));

    const data = riders.map(r => {
      const idStr = r._id.toString();
      return {
        _id: r._id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        isActive: r.isActive,
        vehicle: r.vehicle,
        currentLocation: r.currentLocation
          ? { lat: r.currentLocation.coordinates[1], lng: r.currentLocation.coordinates[0] }
          : null,
        lastLocationUpdate: r.lastLocationUpdate,
        status: busySet.has(idStr) ? 'busy' : (r.isActive ? 'online' : 'offline'),
        totalDeliveries: deliveryCountMap.get(idStr) || 0,
        earnings: { today: todayEarningsMap.get(idStr) || 0 },
      };
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// Customers
//
// Live customer location on an ops map is only actually needed while a
// delivery to that customer is in progress — there's no operational reason
// to track someone's live position once their order is delivered/cancelled,
// or if they've never ordered. Scoping to active orders (rather than every
// customer account) is the main privacy control here, on top of the
// rate-limited audit log below.
const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'packing', 'ready_for_pickup', 'out_for_delivery', 'disputed'];

router.get('/customers/locations', protectAdmin, async (req, res) => {
  try {
    const activeCustomerIds = await Order.distinct('customer', { status: { $in: ACTIVE_ORDER_STATUSES } });

    const filter = { role: 'customer', _id: { $in: activeCustomerIds } };
    const boundsFilter = buildBoundsFilter('currentLocation', req.query);
    if (boundsFilter) {
      // A bounds filter on currentLocation alone would hide customers who
      // only have the static address fallback below — OR them together so
      // the viewport filter doesn't silently drop those.
      const { swLat, swLng, neLat, neLng } = req.query;
      filter.$or = [
        boundsFilter,
        {
          'address.lat': { $gte: Number(swLat), $lte: Number(neLat) },
          'address.lng': { $gte: Number(swLng), $lte: Number(neLng) },
        },
      ];
    }

    const customers = await User.find(filter).select('-password');

    // Rate-limited audit log — see comment on the constants above.
    const adminIdStr = req.user._id.toString();
    const lastLogged = customerLocationLastLogged.get(adminIdStr);
    if (!lastLogged || Date.now() - lastLogged > CUSTOMER_LOCATION_LOG_COOLDOWN_MS) {
      customerLocationLastLogged.set(adminIdStr, Date.now());
      logAdminAction(req.user._id, 'customer_locations.view', 'User', null, { count: customers.length });
    }

    const data = customers.map(c => {
      let loc = null;
      if (c.currentLocation && c.currentLocation.coordinates && c.currentLocation.coordinates.length === 2) {
        loc = {
          lat: c.currentLocation.coordinates[1],
          lng: c.currentLocation.coordinates[0],
        };
      } else if (c.address && c.address.lat && c.address.lng) {
        loc = {
          lat: c.address.lat,
          lng: c.address.lng,
        };
      }
      return {
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        address: c.address,
        currentLocation: loc,
        lastLocationUpdate: c.lastLocationUpdate,
        status: 'customer',
      };
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// Wholesalers – returns saved shopLocation (permanent) and falls back to live location
router.get('/wholesalers/locations', protectAdmin, async (req, res) => {
  try {
    const filter = { role: 'wholesaler' };
    const shopBounds = buildBoundsFilter('shopLocation', req.query);
    const liveBounds = buildBoundsFilter('currentLocation', req.query);
    if (shopBounds && liveBounds) {
      filter.$or = [shopBounds, liveBounds];
    }

    const wholesalers = await User.find(filter).select('-password');
    const data = wholesalers.map(w => {
      let location = null;
 
      // Saved shop location – use only if it's not the default [0,0]
      const shop = w.shopLocation;
      if (shop && shop.coordinates && shop.coordinates.length === 2) {
        const [lng, lat] = shop.coordinates;
        if (lat !== 0 || lng !== 0) {           // ← skip if zeros
          location = {
            lat,
            lng,
            address: shop.address || '',
          };
        }
      }
 
      // Fallback to live GPS if no valid saved location
      if (!location && w.currentLocation && w.currentLocation.coordinates && w.currentLocation.coordinates.length === 2) {
        const [lng, lat] = w.currentLocation.coordinates;
        if (lat !== 0 || lng !== 0) {
          location = { lat, lng };
        }
      }
 
      return {
        _id: w._id,
        name: w.name,
        email: w.email,
        phone: w.phone,
        storeName: w.storeName,
        businessLicense: w.businessLicense,
        isActive: w.isActive,
        shopLocation: w.shopLocation,
        currentLocation: location,        // the one to show on the map
        lastLocationUpdate: w.lastLocationUpdate,
        status: 'wholesaler',
      };
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Product Approval ----------
// GET /api/admin/products/pending?page=&limit=
router.get('/products/pending', protectAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const filter = { status: 'pending' };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('wholesaler', 'storeName name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/products/bulk  { ids: [...], action: 'approve'|'reject', rejectionReason? }
router.put('/products/bulk', protectAdmin, async (req, res) => {
  try {
    const { ids, action, rejectionReason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No products selected' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const products = await Product.find({ _id: { $in: ids } });

    await Promise.all(
      products.map((p) => {
        if (action === 'approve') {
          p.status = 'approved';
          p.isApproved = true;
          // Only fall back to the wholesaler's price when the admin hasn't
          // already set one — never clobber a price that was set earlier.
          if (p.adminPrice == null) p.adminPrice = p.wholesalerPrice ?? p.price;
          p.rejectionReason = '';
        } else {
          p.status = 'rejected';
          p.isApproved = false;
          p.rejectionReason = (rejectionReason || '').trim();
        }
        return p.save();
      })
    );

    logAdminAction(req.user._id, `product.bulk_${action}`, 'Product', null, {
      ids,
      count: products.length,
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
    });

    res.json({
      message: `${products.length} product(s) ${action === 'approve' ? 'approved' : 'rejected'}`,
      count: products.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/products?page=&limit=&search=&category= – paginated catalog
router.get('/products', protectAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const { search, category } = req.query;

    const filter = {};
    if (category && category !== 'all') filter.category = category;

    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };

      const matchingWholesalers = await User.find({
        role: 'wholesaler',
        $or: [{ name: regex }, { storeName: regex }],
      }).select('_id');

      filter.$or = [
        { name: regex },
        { category: regex },
        { wholesaler: { $in: matchingWholesalers.map((w) => w._id) } },
      ];
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('wholesaler', 'storeName name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/products/export?search=&category= – full CSV export
// (ignores pagination — always exports the complete matching set)
router.get('/products/export', protectAdmin, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;

    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };
      const matchingWholesalers = await User.find({
        role: 'wholesaler',
        $or: [{ name: regex }, { storeName: regex }],
      }).select('_id');
      filter.$or = [
        { name: regex },
        { category: regex },
        { wholesaler: { $in: matchingWholesalers.map((w) => w._id) } },
      ];
    }

    const products = await Product.find(filter)
      .populate('wholesaler', 'storeName name email')
      .sort({ createdAt: -1 });

    const columns = [
      'id', 'name', 'category', 'unit', 'weight', 'price', 'wholesalerPrice',
      'adminPrice', 'retailPrice', 'stock', 'lowStockThreshold', 'status',
      'isActive', 'wholesalerEmail', 'wholesalerStoreName', 'description',
    ];
    const rows = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      unit: p.unit,
      weight: p.weight ?? '',
      price: p.price ?? '',
      wholesalerPrice: p.wholesalerPrice ?? '',
      adminPrice: p.adminPrice ?? '',
      retailPrice: p.retailPrice ?? '',
      stock: p.stock ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      status: p.status,
      isActive: p.isActive,
      wholesalerEmail: p.wholesaler?.email || '',
      wholesalerStoreName: p.wholesaler?.storeName || '',
      description: p.description || '',
    }));

    const csv = stringifyCSV(rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="groxo-catalog-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/products/import  (multipart 'csvFile') – bulk create/update
//
// Expected columns: name, category, unit, price, adminPrice, retailPrice,
// stock, lowStockThreshold, wholesalerEmail, description (weight optional).
// An `id` column updates that existing product instead of creating a new
// one. `wholesalerEmail` must match an existing wholesaler account.
router.post('/products/import', protectAdmin, (req, res) => {
  csvUpload.single('csvFile')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

    try {
      const rows = parseCSV(req.file.buffer.toString('utf8'));
      if (rows.length === 0) {
        return res.status(400).json({ message: 'CSV has no data rows' });
      }

      const wholesalerEmails = [...new Set(rows.map((r) => r.wholesalerEmail).filter(Boolean))];
      const wholesalers = await User.find({ role: 'wholesaler', email: { $in: wholesalerEmails } });
      const wholesalerByEmail = new Map(wholesalers.map((w) => [w.email.toLowerCase(), w]));

      let created = 0;
      let updated = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2; // +1 for header row, +1 for 1-indexing

        if (!r.name || !r.category) {
          errors.push(`Row ${rowNum}: name and category are required`);
          continue;
        }

        const fields = {
          name: r.name,
          category: r.category,
          unit: r.unit || 'piece',
          weight: r.weight ? Number(r.weight) : undefined,
          price: r.price !== '' ? Number(r.price) : undefined,
          wholesalerPrice: r.price !== '' ? Number(r.price) : undefined,
          adminPrice: r.adminPrice !== '' ? Number(r.adminPrice) : undefined,
          retailPrice: r.retailPrice !== '' ? Number(r.retailPrice) : undefined,
          stock: r.stock !== '' ? Number(r.stock) : undefined,
          lowStockThreshold: r.lowStockThreshold !== '' ? Number(r.lowStockThreshold) : undefined,
          description: r.description || undefined,
        };
        Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);

        if (r.id) {
          const product = await Product.findById(r.id);
          if (!product) {
            errors.push(`Row ${rowNum}: no product with id "${r.id}" — skipped`);
            continue;
          }
          Object.assign(product, fields);
          await product.save();
          updated++;
        } else {
          const wholesaler = r.wholesalerEmail ? wholesalerByEmail.get(r.wholesalerEmail.toLowerCase()) : null;
          if (!wholesaler) {
            errors.push(`Row ${rowNum}: wholesalerEmail "${r.wholesalerEmail || ''}" not found — skipped`);
            continue;
          }
          if (fields.price === undefined) {
            errors.push(`Row ${rowNum}: price is required for new products — skipped`);
            continue;
          }
          await Product.create({ ...fields, wholesaler: wholesaler._id, status: 'pending' });
          created++;
        }
      }

      logAdminAction(req.user._id, 'product.csv_import', 'Product', null, {
        fileName: req.file.originalname,
        created,
        updated,
        errorCount: errors.length,
      });

      res.json({ created, updated, errors });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
});
 
// ---------- IMAGE UPLOAD – Cloudinary powered, permanent storage ----------
router.put('/products/:id/image', protectAdmin, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected' });
    }
 
    
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'groxo-products',
        use_filename: true,
        unique_filename: true,
      });
 
      // Delete the temporary local file
      fs.unlinkSync(req.file.path);
 
      // Update the product with the permanent Cloudinary URL
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
 
      product.image = result.secure_url;
      await product.save();
 
      console.log('Image uploaded to Cloudinary:', product.image);
      res.json({ message: 'Image uploaded', image: product.image });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ message: 'Image upload failed' });
    }
  });
});
 
// ---------- Generic product update – now AFTER the image route ----------
// PUT /api/admin/products/:id
// Accepts any subset of the product's editable fields so the admin catalog
// page can update name, price and every other product detail in one call.
router.put('/products/:id', protectAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      unit,
      weight,
      price,            // wholesaler's submitted / base price
      wholesalerPrice,  // kept in sync with `price` for older records
      adminPrice,       // final price the platform sells at
      retailPrice,      // suggested retail price
      stock,
      lowStockThreshold,
      isActive,
      status,
      rejectionReason,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const priceChanged =
      (price != null && price !== product.price) ||
      (wholesalerPrice != null && wholesalerPrice !== product.wholesalerPrice) ||
      (adminPrice != null && adminPrice !== product.adminPrice) ||
      (retailPrice != null && retailPrice !== product.retailPrice);
    const priceBefore = {
      price: product.price,
      wholesalerPrice: product.wholesalerPrice,
      adminPrice: product.adminPrice,
      retailPrice: product.retailPrice,
    };
    const statusChanged = status && status !== product.status;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (unit !== undefined) product.unit = unit;
    if (weight !== undefined) product.weight = weight;
    if (price != null) product.price = price;
    if (wholesalerPrice != null) product.wholesalerPrice = wholesalerPrice;
    if (adminPrice != null) product.adminPrice = adminPrice;
    if (retailPrice != null) product.retailPrice = retailPrice;
    if (stock != null) product.stock = stock;
    if (lowStockThreshold != null) product.lowStockThreshold = lowStockThreshold;
    if (isActive !== undefined) product.isActive = isActive;
    if (status) {
      product.status = status;
      product.isApproved = status === 'approved';
      if (status === 'rejected') {
        product.rejectionReason = (rejectionReason || '').trim();
      } else if (status === 'approved') {
        product.rejectionReason = '';
      }
    }

    await product.save();
    await product.populate('wholesaler', 'storeName name email');

    if (statusChanged) {
      logAdminAction(req.user._id, `product.${status}`, 'Product', product._id, {
        status,
        rejectionReason: status === 'rejected' ? product.rejectionReason : undefined,
      });
    }
    if (priceChanged) {
      logAdminAction(req.user._id, 'product.price_change', 'Product', product._id, {
        before: priceBefore,
        after: { price, wholesalerPrice, adminPrice, retailPrice },
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Delete a product ----------
// DELETE /api/admin/products/:id
router.delete('/products/:id', protectAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Order Management ----------
// GET /api/admin/orders?status=&search=&startDate=&endDate=&page=&limit=
//
// `search` matches (case-insensitively) the order number, the customer's
// name, or the customer's phone. A full 24-char Mongo id is also matched
// exactly against `_id`, so pasting an id from a URL/log still works.
// `startDate`/`endDate` are plain 'YYYY-MM-DD' strings filtered against
// `createdAt` (endDate is inclusive of the whole day).
router.get('/orders', protectAdmin, async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const filter = {};
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) filter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };

      const matchingCustomers = await User.find({
        role: 'customer',
        $or: [{ name: regex }, { phone: regex }],
      }).select('_id');

      const orConditions = [
        { orderNumber: regex },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
      ];
      if (mongoose.Types.ObjectId.isValid(term) && term.length === 24) {
        orConditions.push({ _id: term });
      }
      filter.$or = orConditions;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('wholesaler', 'name storeName')
      .populate('wholesalerGroups.wholesaler', 'name storeName')
      .populate('rider', 'name phone vehicle')
      .populate('items.product', 'name price')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ orders, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/settle-all   – mark all unsettled COD orders as settled
router.put('/orders/settle-all', protectAdmin, async (req, res) => {
  try {
    const { riderId } = req.body;   // optional – settle only for this rider
 
    const filter = {
      'payment.method': 'cod',
      riderSettled: false,
      status: 'delivered',
    };
    if (riderId) filter.rider = riderId;
 
    const result = await Order.updateMany(filter, { riderSettled: true });
 
    logAdminAction(req.user._id, 'order.settle_all', 'Order', null, {
      riderId: riderId || 'all',
      modifiedCount: result.modifiedCount,
    });

    res.json({
      message: `Settled ${result.modifiedCount} orders`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/:id  (update order status)
//
// Rider assignment used to be silently supported here too via a bare
// `rider` field — no status change, no timeline entry, no notification.
// That half-working path is gone: assigning a rider now only happens
// through PUT /admin/orders/:id/assign below, which shares the same
// implementation as the customer/rider-app route (status → confirmed,
// timeline entry, push notification) instead of a second divergent one.
router.put('/orders/:id', protectAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status) order.status = status;

    if (status === 'cancelled' && reason && reason.trim()) {
      order.cancellationReason = reason.trim();
    }

    order.timeline.push({
      status: status || order.status,
      timestamp: new Date(),
      note: status === 'cancelled' && order.cancellationReason
        ? `Cancelled by admin — ${order.cancellationReason}`
        : `Admin updated to ${status || order.status}`,
    });

    await order.save();
    await order.populate(['customer', 'wholesaler', 'wholesalerGroups.wholesaler', 'wholesalerGroups.items.product', 'rider', 'items.product']);

    if (status === 'cancelled') {
      logAdminAction(req.user._id, 'order.cancel', 'Order', order._id, {
        reason: order.cancellationReason || undefined,
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/orders/:id/assign  – proper admin-namespaced rider assignment.
// Previously the admin panel called PUT /api/orders/:id/assign directly
// (no /admin prefix), which only worked because `protect` doesn't check
// role — a landmine if role restrictions on /api/orders are ever
// tightened. This mounts the exact same controller logic under the admin
// namespace so it's consistently guarded by `protectAdmin` like every
// other action on this page. The original /api/orders/:id/assign route is
// left in place for any non-admin (e.g. rider self-service) callers.
router.put('/orders/:id/assign', protectAdmin, assignRider);

// GET /api/admin/orders/:id/invoice  – downloadable PDF receipt for one order
router.get('/orders/:id/invoice', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('wholesaler', 'name storeName phone')
      .populate('wholesalerGroups.wholesaler', 'name storeName phone')
      .populate('rider', 'name phone')
      .populate('items.product', 'name price')
      .populate('wholesalerGroups.items.product', 'name price');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const filename = `invoice-${order.orderNumber || order._id.toString().slice(-6)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    generateInvoicePDF(order, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/orders/:id/settle  – mark rider as settled (old single order)
router.put('/orders/:id/settle', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
 
    order.riderSettled = true;
    await order.save();
 
    logAdminAction(req.user._id, 'order.settle', 'Order', order._id, { rider: order.rider });

    res.json({ message: 'Rider marked as settled', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/:orderId/pay-wholesaler-group  – pay a specific group (new)
router.put('/orders/:orderId/pay-wholesaler-group', protectAdmin, async (req, res) => {
  try {
    const { groupIndex } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (groupIndex < 0 || groupIndex >= order.wholesalerGroups.length) {
      return res.status(400).json({ message: 'Invalid group index' });
    }
 
    order.wholesalerGroups[groupIndex].paid = true;
    await order.save();

    logAdminAction(req.user._id, 'order.pay_wholesaler_group', 'Order', order._id, {
      groupIndex,
      wholesaler: order.wholesalerGroups[groupIndex].wholesaler,
    });

    res.json({ message: 'Wholesaler marked as paid', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Riders list (for order assignment dropdown) ----------
router.get('/riders', protectAdmin, async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider', isActive: true }).select('name email phone vehicle');
    res.json(riders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Reports ----------
// GET /api/admin/reports/sales — weekly revenue buckets (last 8 weeks)
router.get('/reports/sales', protectAdmin, async (req, res) => {
  try {
    const WEEKS = 8;
    const now = new Date();

    // Build 8 consecutive 7-day buckets ending "now", oldest first
    const buckets = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 7);
      buckets.push({ start, end, revenue: 0 });
    }

    const orders = await Order.find({
      createdAt: { $gte: buckets[0].start },
      $or: [{ status: 'delivered' }, { 'payment.status': 'paid' }],
    }).select('createdAt payment.amount');

    orders.forEach((o) => {
      const t = new Date(o.createdAt);
      const bucket = buckets.find((b) => t >= b.start && t < b.end);
      if (bucket) bucket.revenue += o.payment?.amount || 0;
    });

    const data = buckets.map((b) => ({
      period: `${b.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${b.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      revenue: b.revenue,
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/reports/rider-performance
router.get('/reports/rider-performance', protectAdmin, async (req, res) => {
  try {
    // A delivery counts as "on time" if it went from out_for_delivery to
    // delivered within this many minutes. No delivery deadline is stored
    // anywhere yet, so this is a business default rather than a real target.
    const ON_TIME_THRESHOLD_MINUTES = 45;

    const riders = await User.find({ role: 'rider' }).select('name');

    const data = await Promise.all(
      riders.map(async (rider) => {
        const orders = await Order.find({ rider: rider._id, status: 'delivered' })
          .select('riderEarning timeline rating');

        let earnings = 0;
        let onTimeCount = 0;
        let ratingSum = 0;
        let ratedCount = 0;

        orders.forEach((o) => {
          earnings += o.riderEarning || 0;

          if (typeof o.rating === 'number') {
            ratingSum += o.rating;
            ratedCount += 1;
          }

          const timeline = o.timeline || [];
          const outEntry = [...timeline].reverse().find((t) => t.status === 'out_for_delivery');
          const deliveredEntry = [...timeline].reverse().find((t) => t.status === 'delivered');
          if (outEntry && deliveredEntry) {
            const minutes = (new Date(deliveredEntry.timestamp) - new Date(outEntry.timestamp)) / 60000;
            if (minutes <= ON_TIME_THRESHOLD_MINUTES) onTimeCount += 1;
          }
        });

        return {
          _id: rider._id,
          name: rider.name,
          earnings,
          onTime: orders.length ? Math.round((onTimeCount / orders.length) * 100) : 0,
          rating: ratedCount ? Number((ratingSum / ratedCount).toFixed(1)) : null,
        };
      })
    );

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Support Tickets ----------
// GET /api/admin/tickets
const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// GET /api/admin/tickets?status=&search=  (status filter + subject/customer search)
router.get('/tickets', protectAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && TICKET_STATUSES.includes(status)) filter.status = status;

    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };
      const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
      filter.$or = [{ subject: regex }, { user: { $in: matchingUsers.map((u) => u._id) } }];
    }

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .populate('replies.sender', 'name role')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/tickets/:id  (update status and/or assignee)
// The model defines open/in_progress/resolved/closed, but this used to only
// ever be driven with 'resolved' from the UI — status is now validated
// against the full enum, and assignedTo (previously unused) can be set here
// too, so a ticket can be handed to a specific staff member.
router.put('/tickets/:id', protectAdmin, async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const update = {};

    if (status !== undefined) {
      if (!TICKET_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${TICKET_STATUSES.join(', ')}` });
      }
      update.status = status;
    }

    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo || null; // allow unassigning with '' or null
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email')
      .populate('replies.sender', 'name role')
      .populate('assignedTo', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/tickets/:id/reply  (admin replies to a ticket)
router.post('/tickets/:id/reply', protectAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: { sender: req.user._id, message: message.trim() } } },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('replies.sender', 'name role')
      .populate('assignedTo', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Transactions (payments + withdrawals combined) ----------
// Shared builder behind both the JSON list route and the CSV export route,
// so filtering logic (type/userId/search) only lives in one place.
async function buildTransactions({ type, userId, search }) {
  let userFilter = {};

  if (userId) {
    // Explicit user id always wins over free-text search when both are given.
    userFilter = { user: userId };
  } else if (search && search.trim()) {
    const term = search.trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
    userFilter = { user: { $in: matchingUsers.map((u) => u._id) } };
  }

  let transactions = [];

  if (!type || type === 'payment') {
    const payments = await Transaction.find(userFilter).populate('user', 'name email').sort('-createdAt');
    transactions.push(
      ...payments.map((t) => ({
        _id: t._id,
        type: 'payment',            // category the UI tabs/filters on — unchanged
        transactionType: t.type,    // the real value: 'credit' | 'debit' (previously dropped)
        amount: t.amount,
        description: t.description,
        reference: t.reference,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        // A Transaction document only ever exists once a ledger entry has
        // actually posted, so 'completed' is accurate here — unlike
        // withdrawals below, this model has no pending/failed state.
        status: 'completed',
        user: t.user,
        createdAt: t.createdAt,
      }))
    );
  }

  if (!type || type === 'withdrawal') {
    const withdrawals = await WithdrawalRequest.find(userFilter).populate('user', 'name email').sort('-createdAt');
    transactions.push(
      ...withdrawals.map((w) => ({
        _id: w._id,
        type: 'withdrawal',
        amount: w.amount,
        status: w.status,
        user: w.user,
        createdAt: w.createdAt,
      }))
    );
  }

  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return transactions;
}

// GET /api/admin/transactions?type=payment|withdrawal&userId=&search=
router.get('/transactions', protectAdmin, async (req, res) => {
  try {
    const { type, userId, search } = req.query;
    const transactions = await buildTransactions({ type, userId, search });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/transactions/export?type=&userId=&search=  — CSV download.
// Reuses the exact same filtering as the JSON list above, so what an admin
// sees on screen is exactly what they get in the file (no separate query
// logic to drift out of sync).
router.get('/transactions/export', protectAdmin, async (req, res) => {
  try {
    const { type, userId, search } = req.query;
    const transactions = await buildTransactions({ type, userId, search });

    const rows = transactions.map((t) => ({
      id: t._id,
      date: t.createdAt ? new Date(t.createdAt).toISOString() : '',
      type: t.type,
      transactionType: t.transactionType || '',
      user: t.user?.name || '',
      email: t.user?.email || '',
      amount: t.amount,
      status: t.status,
      description: t.description || '',
      reference: t.reference || '',
    }));

    const csv = stringifyCSV(rows, [
      'id', 'date', 'type', 'transactionType', 'user', 'email', 'amount', 'status', 'description', 'reference',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/transactions/:id  (approve/reject a withdrawal)
router.put('/transactions/:id', protectAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
 
    withdrawal.status = action === 'approve' ? 'approved' : 'rejected';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
 
    logAdminAction(req.user._id, `withdrawal.${withdrawal.status}`, 'WithdrawalRequest', withdrawal._id, {
      amount: withdrawal.amount,
      user: withdrawal.user,
    });

    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Banners ----------
router.get('/banners', protectAdmin, async (req, res) => {
  const banners = await Banner.find().sort('order');
  res.json(banners);
});
 
router.post('/banners', protectAdmin, async (req, res) => {
  try {
    const { imageUrl, link, isActive, order, startDate, endDate } = req.body;
    const banner = await Banner.create({
      imageUrl, link, isActive, order,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/banners/upload-image — same Cloudinary pattern the product
// catalog already uses, but standalone (no banner id needed yet) so it can
// run from inside the create modal before the banner document exists.
// Registered before /banners/:id so this literal path isn't swallowed by it.
router.post('/banners/upload-image', protectAdmin, (req, res) => {
  uploadBannerImage(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message || err });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected' });
    }
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'groxo-banners',
        use_filename: true,
        unique_filename: true,
      });
      fs.unlinkSync(req.file.path);
      res.json({ message: 'Image uploaded', image: result.secure_url });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ message: 'Image upload failed' });
    }
  });
});

// PUT /api/admin/banners/reorder  { order: [id1, id2, id3, ...] }
// Bulk-writes the `order` field for every banner in one round trip, so the
// frontend's drag-and-drop reorder can persist the whole new sequence at
// once instead of one PUT per row.
router.put('/banners/reorder', protectAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ message: 'order must be a non-empty array of banner ids' });
    }
    const ops = order.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { order: index } },
    }));
    await Banner.bulkWrite(ops);
    const banners = await Banner.find().sort('order');
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
router.put('/banners/:id', protectAdmin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
router.delete('/banners/:id', protectAdmin, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
module.exports = router;