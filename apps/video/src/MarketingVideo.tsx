import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { z } from "zod";

const FADE_FRAMES = 10;

export const marketingVideoSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
});

type MarketingVideoProps = z.infer<typeof marketingVideoSchema>;

const FadeWrapper: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
}> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - FADE_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const ProductMockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 80, stiffness: 120 },
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        width: 900,
        height: 560,
        backgroundColor: "#f5f5f5",
        border: "2px solid #e5e5e5",
        display: "flex",
        flexDirection: "column",
        transform: `scale(${scale}) translateY(${y}px)`,
        opacity,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 36,
          backgroundColor: "#fafafa",
          borderBottom: "1px solid #e5e5e5",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
        }}
      >
        <div style={{ width: 10, height: 10, backgroundColor: "#e5e5e5" }} />
        <div style={{ width: 10, height: 10, backgroundColor: "#e5e5e5" }} />
        <div style={{ width: 10, height: 10, backgroundColor: "#e5e5e5" }} />
        <div
          style={{
            marginLeft: 20,
            fontSize: 12,
            fontFamily: "system-ui",
            color: "#999",
          }}
        >
          LMMs-Lab Writer
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div
          style={{
            width: 200,
            borderRight: "1px solid #e5e5e5",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "#999" }}>▼</span> neurips-2025/
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#000",
              paddingLeft: 16,
              backgroundColor: "#f0f0f0",
              padding: "4px 8px 4px 16px",
            }}
          >
            main.tex
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#666",
              paddingLeft: 16,
            }}
          >
            refs.bib
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#666",
              paddingLeft: 16,
            }}
          >
            figures/
          </div>
        </div>
        <div style={{ flex: 1, padding: 20 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#333",
            }}
          >
            <div>
              <span style={{ color: "#999" }}>1</span>
              {"  "}
              <span style={{ color: "#0066cc" }}>\section</span>
              {"{Related Work}"}
            </div>
            <div>
              <span style={{ color: "#999" }}>2</span>
              {"  "}
            </div>
            <div>
              <span style={{ color: "#999" }}>3</span>
              {"  "}
              Recent advances in vision-language...
            </div>
            <div style={{ marginTop: 8, color: "#999", fontSize: 11 }}>
              ▌ Claude is typing...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const COLORS = {
  bg: "#ffffff",
  fg: "#000000",
  muted: "#666666",
  accent: "#000000",
};

const Title: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = text.split("\n");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {lines.map((line, i) => {
        const lineDelay = delay + i * 10;
        const progress = spring({
          frame: frame - lineDelay,
          fps,
          config: { damping: 100, stiffness: 200 },
        });

        const y = interpolate(progress, [0, 1], [60, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        return (
          <div
            key={i}
            style={{
              fontSize: 80,
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              color: COLORS.fg,
              transform: `translateY(${y}px)`,
              opacity,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

const Subtitle: React.FC<{ text: string; delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        fontSize: 36,
        fontFamily: "system-ui, sans-serif",
        color: COLORS.muted,
        transform: `translateY(${y}px)`,
        opacity,
        marginTop: 30,
      }}
    >
      {text}
    </div>
  );
};

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    "You're a researcher.",
    "You should be thinking about breakthroughs.",
    "Instead you're fighting with \\begin{figure}[htbp]",
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          maxWidth: 1200,
        }}
      >
        {lines.map((line, i) => {
          const delay = i * 25;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 100 },
          });

          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const y = interpolate(progress, [0, 1], [40, 0]);

          const isLast = i === lines.length - 1;

          return (
            <div
              key={i}
              style={{
                fontSize: isLast ? 48 : 56,
                fontFamily: isLast ? "monospace" : "system-ui, sans-serif",
                fontWeight: isLast ? 400 : 500,
                color: isLast ? COLORS.muted : COLORS.fg,
                transform: `translateY(${y}px)`,
                opacity,
                textAlign: "center",
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const SolutionScene: React.FC<MarketingVideoProps> = ({
  headline,
  subheadline,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Title text={headline} delay={0} />
        <Subtitle text={subheadline} delay={20} />
      </div>
      <ProductMockup />
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 150 },
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.fg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            color: COLORS.bg,
          }}
        >
          Download Free
        </div>
        <div
          style={{
            fontSize: 32,
            fontFamily: "system-ui, sans-serif",
            color: "#999999",
          }}
        >
          lmms-lab.com/writer
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MarketingVideo: React.FC<MarketingVideoProps> = (props) => {
  const scene1Duration = 120;
  const scene2Duration = 240;
  const scene3Duration = 90;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence from={0} durationInFrames={scene1Duration}>
        <FadeWrapper durationInFrames={scene1Duration}>
          <ProblemScene />
        </FadeWrapper>
      </Sequence>

      <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
        <FadeWrapper durationInFrames={scene2Duration}>
          <SolutionScene {...props} />
        </FadeWrapper>
      </Sequence>

      <Sequence
        from={scene1Duration + scene2Duration}
        durationInFrames={scene3Duration}
      >
        <FadeWrapper durationInFrames={scene3Duration}>
          <CTAScene />
        </FadeWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
