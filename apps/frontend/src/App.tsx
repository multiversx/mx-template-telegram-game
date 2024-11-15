import { useEffect, useState } from "react";
import { PhaserGame } from "./game/PhaserGame";
import { ItemsMenu } from "./components/ItemsMenu";
import { Game } from "./game/scenes/Game";
import { useClickerLib } from "./hooks/useClickerLib";
import { Trim } from "./components/Trim";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const [scene, setScene] = useState<Phaser.Scene | null>(null);
    const { ClickerLib } = useClickerLib();
    const [txInProgress, setTxInProgress] = useState<
        { txHash: string } | boolean
    >(false);

    const currentScene = (scene: Phaser.Scene) => {
        setScene(scene);
    };

    useEffect(() => {
        setInterval(() => {
            setTxInProgress(ClickerLib.txInProgress);
        }, 100);
    }, []);

    return (
        <div id="app">
            <PhaserGame currentActiveScene={currentScene} />

            {scene?.scene.key === Game.SCENE_ID && !txInProgress && (
                <ItemsMenu currentScene={scene} />
            )}

            {txInProgress ? (
                <div className="ui">
                    <div
                        className="futuristic-background"
                        style={{ padding: "30px" }}
                    >
                        <div>Transaction In Progress...</div>
                        Tx hash:{" "}
                        {typeof txInProgress !== "boolean" &&
                            txInProgress.txHash && (
                                <Trim text={txInProgress.txHash} />
                            )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default App;

