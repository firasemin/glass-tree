"use client";

import React, { useEffect, useRef } from 'react';

// Define the shape of a particle for TypeScript
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
}

const NodeBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>( null );

    useEffect( () => {
        const canvas = canvasRef.current;
        if ( !canvas ) return;

        const ctx = canvas.getContext( '2d' );
        if ( !ctx ) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        // Configuration
        const particleCount = 60;
        const connectionDistance = 150;
        const moveSpeed = 0.5;

        // RGB values for easy opacity manipulation
        const baseColor = '56, 189, 248'; // Tailwind sky-400 equivalent

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        // Create a particle object
        const createParticle = (): Particle => ( {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: ( Math.random() - 0.5 ) * moveSpeed,
            vy: ( Math.random() - 0.5 ) * moveSpeed,
            size: Math.random() * 2 + 1,
        } );

        const init = () => {
            particles = [];
            for ( let i = 0; i < particleCount; i++ ) {
                particles.push( createParticle() );
            }
        };

        const updateParticle = ( p: Particle ) => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if ( p.x < 0 || p.x > canvas.width ) p.vx *= -1;
            if ( p.y < 0 || p.y > canvas.height ) p.vy *= -1;
        };

        const drawParticle = ( p: Particle ) => {
            ctx.beginPath();
            ctx.arc( p.x, p.y, p.size, 0, Math.PI * 2 );
            ctx.fillStyle = `rgba(${baseColor}, 0.6)`;
            ctx.fill();
        };

        const animate = () => {
            ctx.clearRect( 0, 0, canvas.width, canvas.height );

            particles.forEach( ( particle, index ) => {
                updateParticle( particle );
                drawParticle( particle );

                // Check connections with other particles
                for ( let j = index + 1; j < particles.length; j++ ) {
                    const otherParticle = particles[j];
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt( dx * dx + dy * dy );

                    if ( distance < connectionDistance ) {
                        ctx.beginPath();
                        const opacity = 1 - distance / connectionDistance;
                        ctx.strokeStyle = `rgba(${baseColor}, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo( particle.x, particle.y );
                        ctx.lineTo( otherParticle.x, otherParticle.y );
                        ctx.stroke();
                    }
                }
            } );

            animationFrameId = requestAnimationFrame( animate );
        };

        // Initialize
        window.addEventListener( 'resize', resizeCanvas );
        resizeCanvas();
        init();
        animate();

        // Cleanup on unmount
        return () => {
            window.removeEventListener( 'resize', resizeCanvas );
            cancelAnimationFrame( animationFrameId );
        };
    }, [] );

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10 bg-slate-50"
        />
    );
};

export default NodeBackground;