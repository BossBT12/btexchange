import { useEffect, useRef, useState, useCallback } from "react";
import { createTradeSocket } from "../services/tradingSocketService";

export const useTradeSocket = (options = {}) => {
    const {
        autoJoinPublic = true,
        pair = null,
    } = options;

    const [isConnected, setIsConnected] = useState(false);

    const socketApiRef = useRef(null);

    useEffect(() => {
        const api = createTradeSocket();
        socketApiRef.current = api;

        const handleConnect = () => {
            setIsConnected(true);

            if (autoJoinPublic) {
                api.joinPublic();
            }

            if (pair) {
                api.joinPair(pair);
            }
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        api.on("connect", handleConnect);
        api.on("disconnect", handleDisconnect);

        if (api.isConnected()) {
            handleConnect();
        } else {
            setIsConnected(false);
        }

        return () => {
            api.off("connect", handleConnect);
            api.off("disconnect", handleDisconnect);

            if (pair) {
                api.leavePair(pair);
            }
        };
    }, [autoJoinPublic, pair]);

    const joinPair = useCallback((pairSymbol) => {
        const api = socketApiRef.current;
        if (!api) return;
        api.joinPair(pairSymbol);
    }, []);

    const leavePair = useCallback((pairSymbol) => {
        const api = socketApiRef.current;
        if (!api) return;
        api.leavePair(pairSymbol);
    }, []);

    const joinPublic = useCallback(() => {
        const api = socketApiRef.current;
        if (!api) return;
        api.joinPublic();
    }, []);

    const joinUser = useCallback((userIdentifier) => {
        const api = socketApiRef.current;
        if (!api) return;
        api.joinUser(userIdentifier);
        console.log("Joined:", userIdentifier);
    }, []);

    return {
        socket: socketApiRef.current ? socketApiRef.current.socket : null,
        isConnected,
        joinPublic,
        joinPair,
        leavePair,
        joinUser,
    };
};

export default useTradeSocket;
