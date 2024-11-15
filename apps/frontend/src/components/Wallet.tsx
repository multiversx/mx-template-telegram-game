import { useClickerLib } from "../hooks/useClickerLib";
import { Game } from "../game/scenes/Game";
import { useId, useState } from "react";
import { Trim } from "./Trim";

export const Wallet = ({
    currentScene,
    toggleDrawer,
}: {
    currentScene: any;
    toggleDrawer: () => void;
}) => {
    const { accountState, ClickerLib, refetchAccount } = useClickerLib();
    const id = useId();
    const [input, setInput] = useState("");

    const redeemClicked = async () => {
        toggleDrawer();
        try {
            await ClickerLib.redeem();
            await refetchAndUpdate();
        } catch (error) {}
    };

    const withdrawClicked = async (address: string) => {
        toggleDrawer();
        try {
            await ClickerLib.withdraw(address);
            await refetchAndUpdate();
        } catch (error) {}
    };

    const refetchAndUpdate = async () => {
        const newAccountState = await refetchAccount();

        if (currentScene && currentScene.scene.key === Game.SCENE_ID) {
            (currentScene as Game).updateState(newAccountState);
        }
    };

    if (!accountState) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                Loading...
            </div>
        );
    }

    return (
        <div>
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "30px",
                    marginTop: "30px",
                    fontSize: "2rem",
                }}
            >
                WALLET
            </div>
            <div style={{ padding: "20px" }}>
                <div>
                    <strong>Adress: </strong>
                    <Trim text={accountState.address} />
                </div>

                <div style={{ marginTop: "20px" }}>
                    <strong>Balance: </strong>
                    <div className="textContainer" style={{ width: "70%" }}>
                        {accountState.balance}{" "}
                        {accountState.gameConfig.tokenTicker}
                    </div>

                    <div>{accountState.egldBalance} EGLD</div>
                </div>

                <div style={{ marginTop: "20px" }}>
                    <strong>Actions: </strong>
                    <div>
                        <button
                            className={"pixel-art-button "}
                            disabled={accountState.clicks < 1000}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "10px",
                            }}
                            onClick={() => {
                                redeemClicked();
                            }}
                        >
                            REDEEM
                        </button>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                        <div>
                            <label htmlFor={id}>Address: </label>
                            <input
                                disabled={accountState.balance < 1}
                                style={{ width: "100%" }}
                                id={id}
                                value={input}
                                onInput={(e) => setInput(e.currentTarget.value)}
                            />

                            <button
                                className={"pixel-art-button "}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginTop: "10px",
                                }}
                                onClick={() => {
                                    withdrawClicked(input);
                                }}
                            >
                                WITHDRAW
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

