import { Composition } from "remotion";
import { MarketingVideo, marketingVideoSchema } from "./MarketingVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MarketingVideo"
        component={MarketingVideo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        schema={marketingVideoSchema}
        defaultProps={{
          headline: "Let AI Write\nYour Papers",
          subheadline: "You focus on research. Claude handles the LaTeX.",
        }}
      />
    </>
  );
};
