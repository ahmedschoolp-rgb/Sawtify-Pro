
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      // Gradient background or clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const hue = (i / bufferLength) * 360;
        const opacity = isPlaying ? 0.8 : 0.3;
        ctx.fillStyle = `hsla(${210}, 100%, 60%, ${opacity})`;
        
        // Draw bars from center
        const centerY = canvas.height / 2;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 2, barHeight);

        x += barWidth;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [analyser, isPlaying]);

  return (
    <div className="w-full h-40 relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        className="w-full h-full"
      />
    </div>
  );
};

export default Visualizer;
