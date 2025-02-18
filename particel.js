particlesJS("particles-js", {
    particles: {
        number: {
            value: 100,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: [
                "#ff0000", // Merah
                "#ff7f00", // Oranye
                "#ffff00", // Kuning
                "#7fff00", // Hijau
                "#00ff00", // Hijau Muda
                "#00ffff", // Cyan
                "#007fff", // Biru
                "#0000ff", // Biru Tua
                "#7f00ff", // Ungu
                "#ff00ff"  // Magenta

            ]
        },
        shape: {
            type: "circle",  // Bentuk bulat seperti serpihan salju
            stroke: {
                width: 0,
                color: "#000000"
            },
            polygon: {
                nb_sides: 6
            },
            image: {
                src: "img/snowflake.svg",  // Gambar serpihan salju (opsional)
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
            enable: false  // Tidak ada garis antar partikel
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
});
