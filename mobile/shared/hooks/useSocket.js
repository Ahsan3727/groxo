import { useEffect, useRef } from 'react';
import { socket } from '../services/api';

export const useSocket = (event, handler) => {
  const savedHandler = useRef(handler);
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (data) => savedHandler.current(data);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
};
