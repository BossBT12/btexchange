import { io } from "socket.io-client";

let socketInstance = null;
let connectionCount = 0;

function createSocketInstance() {
  const socketUrl =
    import.meta.env.VITE_SOCKET_BASE_URL || import.meta.env.VITE_API_BASE_URL;

  if (!socketUrl) {
    throw new Error(
      "Socket base URL could not be resolved. Please set VITE_SOCKET_BASE_URL or VITE_API_BASE_URL in your .env file."
    );
  }

  const socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    secure: String(socketUrl).startsWith("https"),
    autoConnect: true,
    path: "/socket.io",
  });

  // Track if we've already joined the public room for this connection
  let joinedPublicForConnection = false;

  const safeLog = (...args) => {
    if (import.meta.env.DEV) {
      // Avoid noisy logs in production
      console.log(...args);
    }
  };

  socket.on("connect", () => {
    joinedPublicForConnection = false;
    safeLog("[TradingSocket] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    safeLog("[TradingSocket] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[TradingSocket] Connection Error:", error?.message || error);
  });

  const joinUser = (userEmail) => {
    if (!userEmail) return;
    if (!socket.connected) return;

    socket.emit("join_user", userEmail);
    safeLog("[TradingSocket] Joined user room:", userEmail);
  };

  /**
   * Join the global public prices room.
   * This is idempotent per connection – multiple calls are safe and
   * will not emit duplicate join events for the same connection.
   */
  const joinPublic = () => {
    if (!socket.connected) return;
    if (joinedPublicForConnection) return;

    socket.emit("join_public");
    joinedPublicForConnection = true;
    safeLog("[TradingSocket] Joined public prices room");
  };

  const joinPair = (pair) => {
    if (!pair || !socket.connected) return;
    socket.emit("join_pair", pair);
    safeLog("[TradingSocket] Joined pair room:", pair);
  };

  const leavePair = (pair) => {
    if (!pair || !socket.connected) return;
    socket.emit("leave_pair", pair);
    safeLog("[TradingSocket] Left pair room:", pair);
  };

  const pairPrices = (callback) => {
    if (typeof callback !== "function") return () => { };

    const handler = (prices) => {
      callback(prices);
    };

    socket.on("pair_prices", handler);

    return () => {
      socket.off("pair_prices", handler);
    };
  };

  const selectedPairPrices = (callback) => {
    if (typeof callback !== "function") return () => { };

    const handler = (prices) => {
      callback(prices);
    };

    socket.on("pair_price", handler);

    return () => {
      socket.off("pair_price", handler);
    };
  };

  const betStarted = (callback) => {
    if (typeof callback !== "function") return () => { };
    const handler = (data) => {
      callback(data);
    };
    socket.on("bet_started", handler);
    return () => {
      socket.off("bet_started", handler);
    };
  };

  const betResult = (callback) => {
    if (typeof callback !== "function") return () => { };
    const handler = (data) => {
      callback(data);
    };
    socket.on("bet_result", handler);
    return () => {
      socket.off("bet_result", handler);
    };
  };

  const on = (event, callback) => {
    if (!event || typeof callback !== "function") return;
    socket.on(event, callback);
  };

  const off = (event, callback) => {
    if (!event || typeof callback !== "function") return;
    socket.off(event, callback);
  };

  const disconnect = () => {
    connectionCount -= 1;
    if (connectionCount <= 0) {
      try {
        socket.disconnect();
      } catch (e) {
        console.warn("[TradingSocket] Disconnect error:", e);
      } finally {
        socketInstance = null;
        connectionCount = 0;
        safeLog("[TradingSocket] Disconnected manually.");
      }
    }
  };

  const isConnected = () => socket.connected;

  return {
    socket,
    on,
    off,
    joinUser,
    joinPublic,
    joinPair,
    leavePair,
    pairPrices,
    selectedPairPrices,
    betStarted,
    betResult,
    disconnect,
    isConnected,
  };
}

export function createTradeSocket() {
  if (!socketInstance) {
    socketInstance = createSocketInstance();
    connectionCount = 0;
  }

  connectionCount += 1;
  return socketInstance;
}