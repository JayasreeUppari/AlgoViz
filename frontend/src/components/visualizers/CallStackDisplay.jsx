import "../../styles/CallStackDisplay.css";

export default function CallStack({ stack }) {

    return (
        <div className="call-stack">

            <h3>Call Stack</h3>

            {[...stack].reverse().map((frame, index) => (

                <div
                    key={index}
                    className={
                        index === 0
                            ? "frame active-frame"
                            : "frame"
                    }
                >

                    <div className="frame-title">
                        {frame.functionName}()
                    </div>

                    {Object.entries(frame.params || {}).map(([k, v]) => (

                        <div className="param" key={k}>
                            <span>{k}</span>
                            <span>{v}</span>
                        </div>

                    ))}

                </div>

            ))}

        </div>
    );

}