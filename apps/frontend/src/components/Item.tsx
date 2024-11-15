interface ItemProps {
    icon: string;
    title: string;
    subtitle: string;
    className?: string;
    coinIcon: string;
    price: string;
    buyClicked: () => void;
    buyDisabled: boolean;
    maxBuy: boolean;
}

export const Item = ({
    icon,
    title,
    subtitle,
    className,
    coinIcon,
    price,
    buyClicked,
    buyDisabled,
    maxBuy,
}: ItemProps) => {
    return (
        <div className={className + " itemContainer"}>
            <div
                className="flexRow"
                style={{
                    justifyContent: "align-self",
                }}
            >
                <div>
                    <img height="50" src={icon} />
                </div>
                <div className="flexCol itemTextContainer">
                    <div>{title}</div>
                    <div>{subtitle}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <div style={{ textAlign: "right" }}>
                        <button
                            disabled={buyDisabled}
                            className={
                                "pixel-art-button " +
                                (maxBuy ? "max-upgrade" : "")
                            }
                            onClick={buyClicked}
                        >
                            {maxBuy ? "MAX" : "BUY"}
                        </button>
                    </div>
                    {!maxBuy && (
                        <div className="flexRow">
                            <div style={{ padding: "5px" }}>
                                <small>price: {price}</small>
                            </div>
                            <div>
                                <img height="30" src={coinIcon} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

