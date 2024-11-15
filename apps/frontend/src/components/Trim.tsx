export const Trim = ({ text }: { text: string }) => {
    return (
        <div className="textContainer" style={{ width: "70%" }}>
            <span className="left">{text.slice(0, text.length / 2)}</span>
            <span className="right">
                {text.slice(text.length / 2, text.length)}
            </span>
        </div>
    );
};

