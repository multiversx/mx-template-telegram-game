import { Game } from "./Game";
import { AlignGrid, BaseScene } from "phaser-utility";

export class Preloader extends BaseScene {
    static SCENE_ID = "Preloader";
    private ClickerLib = (window as any).ClickerLib;

    constructor() {
        super(Preloader.SCENE_ID);
    }

    init() {
        this.grid = new AlignGrid(this, 11, 11, 1024, 1793);
        //  A simple progress bar. This is the outline of the bar.
        const outline = this.add
            .rectangle(512, 384, 468, 32)
            .setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);
        this.grid.placeAtIndex(60, outline);
        this.grid.placeAtIndex(60, bar);
        bar.x = bar.x - 230;

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 460 * progress;
        });
    }

    async preload() {
        //  Load the assets for the game - Replace with your own assets

        this.load.setPath("assets");

        this.load.image("cityBackground", "city_background.webp");
        this.load.image("car", "city/car.png");
        this.load.image("bench", "city/bench.png");
        this.load.image("screen", "city/screen.png");
        this.load.image("sign", "city/sign.png");
        this.load.image("store", "city/store.png");
        this.load.image("coin", "coin.png");

        this.load.image("bug", "sky/bug.png");
        this.load.image("drone", "sky/drone.png");
        this.load.image("moto", "sky/moto.png");
        this.load.image("ufo", "sky/ufo.png");
        this.load.image("zep", "sky/zep.png");

        this.load.image("scoreBoard", "score_board.png");
        this.load.audio("coinAudio", "coin_sound.wav");
        this.load.audio("backgroundLoop", "background_loop.mp3");

        this.ClickerLib.init({
            walletStorageKey: "mxClickerWallet",
            gameApiUrl: "wss://3a599743268b.ngrok.app",
            apiUrl: "https://api.multiversx.com",
        });
    }

    async create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        await this.ClickerLib.connect();
        this.scene.start(Game.SCENE_ID);
    }
}

