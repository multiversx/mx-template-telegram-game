import { useState } from "react";
import { useClickerLib } from "../hooks/useClickerLib";
import { Item } from "./Item";
import { Game } from "../game/scenes/Game";

export const GameCollectables = ({
    upgradeCategory,
    currentScene,
    title,
    itemsData,
    toggleDrawer,
}: {
    upgradeCategory: string;
    currentScene: any;
    title: string;
    itemsData: { icon: string; title: string; subtitle: string }[];
    toggleDrawer: () => void;
}) => {
    const { accountState, ClickerLib, refetchAccount } = useClickerLib();
    const [buyInProgress, setBuyInProgress] = useState(false);

    const buyClicked = async (index: number) => {
        setBuyInProgress(true);
        toggleDrawer();
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
                    fontSize: "1rem",
                }}
            >
                {title.toUpperCase()}
            </div>

            {accountState?.purchasesState.upgradeData[upgradeCategory].map(
                (item: { price: string; bought: boolean }, index: number) => {
                    const coinIcon =
                        upgradeCategory === "skyItems" ||
                        upgradeCategory === "cityItems"
                            ? ""
                            : "assets/coin.png";
                    return (
                        <Item
                            icon={itemsData[index].icon}
                            title={itemsData[index].title}
                            subtitle={itemsData[index].subtitle}
                            className="item"
                            price={`${item.price}
                                ${accountState.gameConfig.tokenTicker}`}
                            coinIcon={coinIcon}
                            buyClicked={() => {
                                buyClicked(index);
                            }}
                            buyDisabled={
                                buyInProgress ||
                                accountState.balance < item.price
                            }
                            maxBuy={item.bought}
                        />
                    );
                },
            )}
        </div>
    );
};

