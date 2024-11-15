import { useEffect, useState } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { Game } from "../game/scenes/Game";
import { GameCollectables } from "./GameCollectables";
import { GameUpgrades } from "./GameUpgrades";
import { Wallet } from "./Wallet";

const cityItemsData = [
    { icon: "assets/city/bench.png", title: "Bench", subtitle: "" },
    { icon: "assets/city/car.png", title: "Car", subtitle: "" },
    { icon: "assets/city/screen.png", title: "Screen", subtitle: "" },
    { icon: "assets/city/sign.png", title: "Sign", subtitle: "" },
    { icon: "assets/city/store.png", title: "Store", subtitle: "" },
];

const skyItemsData = [
    { icon: "assets/sky/bug.png", title: "Bug", subtitle: "" },
    { icon: "assets/sky/drone.png", title: "Drone", subtitle: "" },
    { icon: "assets/sky/moto.png", title: "Moto", subtitle: "" },
    { icon: "assets/sky/ufo.png", title: "Ufo", subtitle: "" },
    { icon: "assets/sky/zep.png", title: "Zep", subtitle: "" },
];

export const ItemsMenu = ({
    currentScene,
}: {
    currentScene: Phaser.Scene | null;
}) => {
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [currentSelectedGroup, setCurrentSelectedGroup] = useState<
        number | null
    >(null);

    const toggleDrawer = (currentSelectedGroup?: number) => {
        setDrawerOpened((prevState) => !prevState);
        if (currentSelectedGroup) {
            setCurrentSelectedGroup(currentSelectedGroup);
            return;
        }
        setCurrentSelectedGroup(null);
    };

    useEffect(() => {
        toggleGameClicking();
    }, [drawerOpened, currentScene]);

    const toggleGameClicking = () => {
        if (currentScene && currentScene.scene.key === Game.SCENE_ID) {
            (currentScene as Game).setCanInterract(!drawerOpened);
        }
    };

    const itemGroupToDisplay = () => {
        switch (currentSelectedGroup) {
            case 1:
                return (
                    <GameUpgrades
                        upgradeCategory="clickUpgrades"
                        currentScene={currentScene}
                        title="Click Upgrades"
                        icon="assets/click_upgrade.png"
                        itemSubtitle="Adds per click"
                    />
                );
            case 2:
                return (
                    <GameCollectables
                        upgradeCategory="skyItems"
                        currentScene={currentScene}
                        title="Sky"
                        itemsData={skyItemsData}
                        toggleDrawer={toggleDrawer}
                    />
                );

            case 3:
                return (
                    <GameCollectables
                        upgradeCategory="cityItems"
                        currentScene={currentScene}
                        title="City"
                        itemsData={cityItemsData}
                        toggleDrawer={toggleDrawer}
                    />
                );

            case 4:
                return (
                    <GameUpgrades
                        upgradeCategory="automationUpgrades"
                        currentScene={currentScene}
                        title="Automation"
                        icon="assets/automation_upgrades.png"
                        itemSubtitle="Adds per second"
                    />
                );
            case 5:
                return (
                    <Wallet
                        currentScene={currentScene}
                        toggleDrawer={toggleDrawer}
                    />
                );

            default:
                return <>not defined</>;
        }
    };

    return (
        <div className="ui">
            <div style={{ cursor: "pointer" }} onClick={() => toggleDrawer(5)}>
                <img src="assets/wallet_icon.png" height="100" />
            </div>

            <div>
                <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                    className="futuristic-background"
                >
                    <div className="menuItem" onClick={() => toggleDrawer(1)}>
                        <img
                            style={{ maxWidth: "90px" }}
                            src="assets/icons/artefacts.png"
                        />
                    </div>

                    <div className="menuItem" onClick={() => toggleDrawer(2)}>
                        <img
                            style={{ maxWidth: "90px" }}
                            src="assets/icons/sky.png"
                        />
                    </div>

                    <div className="menuItem" onClick={() => toggleDrawer(3)}>
                        <img
                            style={{ maxWidth: "90px" }}
                            src="assets/icons/city.png"
                        />
                    </div>

                    <div className="menuItem" onClick={() => toggleDrawer(4)}>
                        <img
                            style={{ maxWidth: "90px" }}
                            src="assets/icons/automation.png"
                        />
                    </div>
                </div>
            </div>

            <Drawer
                open={drawerOpened}
                direction="bottom"
                size={"570px"}
                onClose={toggleDrawer}
                className="drawer"
                style={{ overflow: "auto" }}
                zIndex={100000}
            >
                {itemGroupToDisplay()}
            </Drawer>
        </div>
    );
};

