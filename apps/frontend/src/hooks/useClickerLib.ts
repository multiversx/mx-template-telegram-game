import { useEffect, useState } from "react";

export const useClickerLib = () => {
    const ClickerLib = (window as any).ClickerLib;
    const [accountState, setAccountState] = useState<any>(null);

    useEffect(() => {
        getAccountInfo();
    }, []);

    const getAccountInfo = async (): Promise<any> => {
        const result = await ClickerLib.getState();
        setAccountState(result);
        return result;
    };

    return { ClickerLib, accountState, refetchAccount: getAccountInfo };
};

