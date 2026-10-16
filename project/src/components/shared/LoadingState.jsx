import { useEffect, useState } from "react";
import "./LoadingState.css";

const LOADING_DISPLAY_DELAY = 180;

const LoadingState = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setVisible(true),
      LOADING_DISPLAY_DELAY
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!visible) return null;

  return (
    <div className="data-loading-state" role="status" aria-label="Loading">
      <img src="/loading.svg" alt="" />
    </div>
  );
};

export default LoadingState;
