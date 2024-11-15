import { useState } from "react";
import { useClickerLib } from "../hooks/useClickerLib";
import { Item } from "./Item";
import { Game } from "../game/scenes/Game";

export const GameUpgrades = ({
    upgradeCategory,
    currentScene,
    icon,
    title,
    itemSubtitle,
}: {
    upgradeCategory: string;
    currentScene: any;
    icon: string;
    title: string;
    itemSubtitle: string;
}) => {
    const { accountState, ClickerLib, refetchAccount } = useClickerLib();
    const [buyInProgress, setBuyInProgress] = useState(false);

    const configPerk =
        upgradeCategory === "automationUpgrades"
            ? "moneyPerSecond"
            : "clickingMultiplier";

    const buyClicked = async (index: number) => {
        setBuyInProgress(true);
        try {
            await ClickerLib.buyItem({ category: upgradeCategory, index });
            const newAccountState = await refetchAccount();

            if (currentScene && currentScene.scene.key === Game.SCENE_ID) {
                (currentScene as Game).updateState(newAccountState);
            }
        } catch (error) {}
        setBuyInProgress(false);
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
                {title.toUpperCase()}
            </div>

            {accountState?.purchasesState.upgradeData[upgradeCategory].map(
                (
                    item: { price: string; itemsBought: number },
                    index: number
                ) => {
                    return (
                        <Item
                            icon={icon}
                            title={"LEVEL " + (index + 1)}
                            subtitle={`${itemSubtitle}:
                                ${accountState.gameConfig.upgradeConfig[upgradeCategory][configPerk][index]}`}
                            className="item"
                            price={item.price}
                            coinIcon="assets/coin.png"
                            buyClicked={() => {
                                buyClicked(index);
                            }}
                            buyDisabled={
                                buyInProgress ||
                                accountState.clicks < item.price
                            }
                            maxBuy={
                                item.itemsBought ===
                                accountState.gameConfig.upgradeConfig[
                                    upgradeCategory
                                ].maxBuyPerItem[index]
                            }
                        />
                    );
                }
            )}
        </div>
    );
};

