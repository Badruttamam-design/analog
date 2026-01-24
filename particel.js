// Store default particle configuration
const defaultParticleConfig = {
    particles: {
        number: {
            value: 100,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: ["#00d9ff", "#f70dbc", "#ffeb3b"]
        },
        shape: {
            type: "circle",
            stroke: {
                width: 0,
                color: "#000000"
            },
            polygon: {
                nb_sides: 6
            },
            image: {
                src: "img/snowflake.svg",
                width: 50,
                height: 50
            }
        },
        opacity: {
            value: 0.8,
            random: true,
            anim: {
                enable: true,
                speed: 1.5,
                opacity_min: 0.2,
                sync: false
            }
        },
        size: {
            value: 7,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                size_min: 1,
                sync: false
            }
        },
        line_linked: {
            enable: false
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: {
                enable: true,
                mode: "bubble"
            },
            onclick: {
                enable: true,
                mode: "push"
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 300,
                line_linked: {
                    opacity: 1
                }
            },
            bubble: {
                distance: 300,
                size: 50,
                duration: 2,
                opacity: 1,
                speed: 3
            },
            repulse: {
                distance: 150,
                duration: 0.4
            },
            push: {
                particles_nb: 6
            },
            remove: {
                particles_nb: 2
            }
        }
    },
    retina_detect: true
};

// Ramadhan particle configuration with custom shapes
const ramadhanParticleConfig = {
    particles: {
        number: {
            value: 80,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: ["#22c55e", "#fbbf24", "#a855f7", "#10b981", "#ffd700"]
        },
        shape: {
            type: ["circle", "edge", "triangle", "polygon"],
            stroke: {
                width: 0,
                color: "#000000"
            },
            polygon: {
                nb_sides: 5  // Star shape
            }
        },
        opacity: {
            value: 0.85,
            random: true,
            anim: {
                enable: true,
                speed: 1.2,
                opacity_min: 0.3,
                sync: false
            }
        },
        size: {
            value: 8,
            random: true,
            anim: {
                enable: true,
                speed: 1.5,
                size_min: 2,
                sync: false
            }
        },
        line_linked: {
            enable: false
        },
        move: {
            enable: true,
            speed: 1.5,
            direction: "top",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
                enable: true,
                rotateX: 600,
                rotateY: 1200
            }
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: {
                enable: true,
                mode: "bubble"
            },
            onclick: {
                enable: true,
                mode: "repulse"
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 300,
                line_linked: {
                    opacity: 1
                }
            },
            bubble: {
                distance: 250,
                size: 60,
                duration: 2,
                opacity: 1,
                speed: 3
            },
            repulse: {
                distance: 200,
                duration: 0.4
            },
            push: {
                particles_nb: 5
            },
            remove: {
                particles_nb: 2
            }
        }
    },
    retina_detect: true
};

// Initialize with default configuration
particlesJS("particles-js", defaultParticleConfig);

// Global functions to switch particle modes
window.activateRamadhanParticles = function () {
    if (window.pJSDom && window.pJSDom.length > 0) {
        // Destroy existing particles
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];

        // Reinitialize with Ramadhan config
        particlesJS("particles-js", ramadhanParticleConfig);

        console.log('🌙 Ramadhan Particle Effects Activated');
    }
};

window.deactivateRamadhanParticles = function () {
    if (window.pJSDom && window.pJSDom.length > 0) {
        // Destroy existing particles
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];

        // Reinitialize with default config
        particlesJS("particles-js", defaultParticleConfig);

        console.log('Default Particle Effects Restored');
    }
};
