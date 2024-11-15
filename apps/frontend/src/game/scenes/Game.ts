import { AlignGrid, BaseScene } from "phaser-utility";
import { EventBus } from "../EventBus";
import Phaser from "phaser";
export class Game extends BaseScene {
    static SCENE_ID = "Game";
    private debug = false;
    private coins;
    private coinsSound;
    private _accountState = {};
    private scoreText;
    private canInterract = false;
    private ClickerLib = (window as any).ClickerLib;
    private automatedClicksOn = false;
    private clickPerSecondText;
    private tokensBalanceText;

    private skyItems: Phaser.GameObjects.Image[] = [];
    private cityItems: Phaser.GameObjects.Image[] = [];

    constructor() {
        super(Game.SCENE_ID);
    }

    public set accountState(v: any) {
        this._accountState = { ...this._accountState, ...v };
        this.scoreText.text = this.accountState.clicks;
        this.clickPerSecondText.text = `+${this.accountState.purchasesState.MoneyPerSecond}/s`;
        this.tokensBalanceText.text = `${this.accountState.balance} ${this.accountState.gameConfig.tokenTicker}`;
        if (this.accountState.purchasesState.MoneyPerSecond) {
            this.startAutomatedMoney();
        }

        this.accountState.purchasesState.upgradeData.skyItems.map(
            ({ bought }: { bought: boolean }, index: number) => {
                this.skyItems[index].visible = bought;
            }
        );

        this.accountState.purchasesState.upgradeData.cityItems.map(
            ({ bought }: { bought: boolean }, index: number) => {
                this.cityItems[index].visible = bought;
            }
        );
    }

    public get accountState(): any {
        return this._accountState;
    }

    async create() {
        this.prepareGameBackground();
        this.addGameCityItems();
        this.addGameSkyItems();
        this.addMenuItems();
        this.coinsSetup();

        for (const cityItem of this.cityItems) {
            cityItem.visible = false;
        }

        for (const skyItem of this.skyItems) {
            skyItem.visible = false;
        }

        const backgroundSound = this.sound.add("backgroundLoop", {
            loop: true,
        });
        backgroundSound.play();
        backgroundSound.volume = 0.01;
        this.coinsSound = this.sound.add("coinAudio", { loop: false });

        this.scoreText = this.add
            .text(0, 0, "...")
            .setFontSize("70px")
            .setColor("black");
        this.scoreText.x = 290;
        this.scoreText.y = 110;
        this.scoreText.setOrigin(1, 1);

        this.clickPerSecondText = this.add
            .text(0, 0, "")
            .setFontSize("40px")
            .setColor("black");
        this.clickPerSecondText.x = 350;
        this.clickPerSecondText.y = 70;
        this.clickPerSecondText.setOrigin(0, 0);

        this.tokensBalanceText = this.add
            .text(0, 0, "")
            .setFontSize("40px")
            .setColor("black");
        this.tokensBalanceText.x = 200;
        this.tokensBalanceText.y = 230;
        this.tokensBalanceText.setOrigin(0.5, 0.5);

        this.accountState = await this.ClickerLib.accountState;
        EventBus.emit("current-scene-ready", this);
        this.canInterract = true;
    }

    addMenuItems() {
        const scoreBoard = this.add.image(0, 0, "scoreBoard");
        scoreBoard.setOrigin(0, 0);
        scoreBoard.scale = 0.2;

        const coin = this.add.image(0, 0, "coin");
        coin.scale = 0.15;
        coin.setOrigin(0, 0);
        coin.x = -25;
        coin.y = 10;
    }

    private coinsSetup() {
        this.physics.world.setBounds(0, 0, 1024, 1793);

        this.coins = this.physics.add.group({
            immovable: true,
            allowGravity: true,
        });
    }

    setCanInterract(canInterract: boolean) {
        this.canInterract = canInterract;
    }

    updateState(accountState: any) {
        this.accountState = accountState;
    }

    private startAutomatedMoney() {
        if (this.automatedClicksOn) return;
        this.automatedClicksOn = true;
        setInterval(async () => {
            const newAccountState = await this.ClickerLib.automatedMoney();
            this.accountState = newAccountState;
        }, 1500);
    }

    async createCoin() {
        this.coinsSound.play();

        this.accountState = await this.ClickerLib.click();

        const coins = this.coins;
        let coin = this.add.image(0, 0, "coin");
        coin.y = Phaser.Math.Between(600, 100);
        coin.x = 100 + Phaser.Math.Between(0, 900);
        coin.scale = 0.05;

        coin = this.physics.add.existing(coin);

        coins.add(coin);
    }

    private prepareGameBackground() {
        const cityBg = this.add.image(0, 0, "cityBackground");
        cityBg.setOrigin(0, 0);

        cityBg.setInteractive();

        cityBg.on("pointerdown", () => {
            if (!this.canInterract) {
                return;
            }
            this.createCoin();
        });

        this.grid = new AlignGrid(this, 11, 11, 1024, 1793);
        if (this.debug) {
            this.grid.showNumbers();
        }
    }

    private addGameCityItems() {
        const bench = this.add.image(0, 0, "bench");
        bench.scale = 0.2;
        this.grid.placeAtIndex(72, bench);
        bench.x = bench.x - 10;
        bench.y = bench.y + 50;
        this.cityItems.push(bench);

        const car = this.add.image(0, 0, "car");
        car.scale = 0.2;
        this.grid.placeAtIndex(80, car);
        this.cityItems.push(car);

        const screen = this.add.image(0, 0, "screen");
        screen.scale = 0.2;
        this.grid.placeAtIndex(64, screen);
        screen.y = screen.y + 13;
        this.cityItems.push(screen);

        const sign = this.add.image(0, 0, "sign");
        sign.scale = 0.2;
        this.grid.placeAtIndex(58, sign);
        this.cityItems.push(sign);

        const store = this.add.image(0, 0, "store");
        store.scale = 0.2;
        this.grid.placeAtIndex(84, store);
        this.cityItems.push(store);
    }

    private addGameSkyItems() {
        const bug = this.add.image(0, 0, "bug");
        bug.scale = 0.2;
        this.grid.placeAtIndex(20, bug);
        this.skyItems.push(bug);

        const drone = this.add.image(0, 0, "drone");
        drone.scale = 0.2;
        this.grid.placeAtIndex(28, drone);
        drone.x = drone.x - 10;
        drone.y = drone.y + 50;
        this.skyItems.push(drone);

        const moto = this.add.image(0, 0, "moto");
        moto.scale = 0.2;
        this.grid.placeAtIndex(23, moto);
        moto.y = moto.y + 13;
        this.skyItems.push(moto);

        const ufo = this.add.image(0, 0, "ufo");
        ufo.scale = 0.2;
        this.grid.placeAtIndex(15, ufo);
        this.skyItems.push(ufo);

        const zep = this.add.image(0, 0, "zep");
        zep.scale = 0.2;
        this.grid.placeAtIndex(7, zep);
        zep.y = zep.y + 13;
        this.skyItems.push(zep);
    }
}

