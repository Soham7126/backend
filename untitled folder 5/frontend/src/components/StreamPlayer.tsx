import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface StreamPlayerProps {
  streamUrl: string;
}

const StreamPlayer = ({ streamUrl }: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((error) => {
            console.log("Autoplay prevented:", error);
          });
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // For Safari
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((error) => {
            console.log("Autoplay prevented:", error);
          });
        });
      }
    }
  }, [streamUrl]);

  return (
    <video
      ref={videoRef}
      controls
      style={{
        width: "100%",
        maxHeight: "600px",
        backgroundColor: "#000",
      }}
    />
  );
};

export default StreamPlayer;
