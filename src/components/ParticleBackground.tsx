import { useEffect, useRef } from "react";
import { tsParticles, type Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const ParticleBackground = () => {
  const containerRef = useRef<Container | null>(null);
  
  useEffect(() => {
    const initParticles = async () => {
      await loadSlim(tsParticles);

      const container = await tsParticles.load({
        id: "tsparticles",
        options: {
          fpsLimit: 60,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push"
              },
              onHover: {
                enable: true,
                mode: "repulse"
              }
            },
            modes: {
              push: {
                quantity: 4
              },
              repulse: {
                distance: 200,
                duration: 0.4
              }
            }
          },
          particles: {
            color: {
              value: ["#8B5CF6", "#3B82F6", "#EC4899"]
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1
            },
            collisions: {
              enable: true
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce"
              },
              random: false,
              speed: 1,
              straight: false
            },
            number: {
              density: {
                enable: true
              },
              value: 80
            },
            opacity: {
              value: 0.5
            },
            shape: {
              type: "circle"
            },
            size: {
              value: { min: 1, max: 5 }
            }
          },
          detectRetina: true
        }      });
      
      if (container) {
        containerRef.current = container;
      }
    };

    initParticles();return () => {
      if (containerRef.current) {
        containerRef.current.destroy();
      }
    };
  }, []);

  return <div id="tsparticles" className="absolute inset-0 z-0" />;
};

export default ParticleBackground;