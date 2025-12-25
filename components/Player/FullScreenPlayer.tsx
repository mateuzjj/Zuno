import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../../store/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Shuffle, Repeat, Volume2, Volume1, VolumeX, Download } from 'lucide-react';
import { DownloadService } from '../../services/download';
import { toast } from '../UI/Toast';

export const FullScreenPlayer: React.FC = () => {
    const {
        currentTrack,
        status,
        currentTime,
        duration,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        isExpanded,
        toggleExpanded,
        volume,
        setVolume
    } = usePlayer();

    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const volumeRef = useRef<HTMLDivElement>(null);

    if (!currentTrack || !isExpanded) return null;

    const isPlaying = status === 'PLAYING';

    // --- Circular Volume Logic ---
    // Geometry
    const radius = 140; // Approx matching the 320px container (w-80) with padding
    const center = 160; // Center of 320px
    const strokeWidth = 6;

    // Convert polar to cartesian
    const valueToPoint = (value: number) => {
        // Value 0-1 mapped to Angle
        // Start at -225deg (bottom-left) to +45deg (bottom-right) -> 270deg range
        // 0 volume = 135deg (bottom-left) relative from top? 
        // Let's use standard trigonometric circle: 0 is right, -90 is top.
        // Range: 135deg (bottom right) to 405deg (bottom left)?
        // Let's simplify: 
        // Min Angle: 135 degrees (Bottom Left)
        // Max Angle: 405 degrees (Top + Right + Bottom Right) -> Total 270 range.

        const startAngle = 135;
        const endAngle = 405;
        const angleRange = endAngle - startAngle;
        const angleInDegrees = startAngle + (value * angleRange);

        const angleInRadians = (angleInDegrees * Math.PI) / 180;

        const x = center + radius * Math.cos(angleInRadians);
        const y = center + radius * Math.sin(angleInRadians);
        return { x, y };
    };

    const calculateVolumeFromEvent = (e: React.PointerEvent | PointerEvent) => {
        if (!volumeRef.current) return;

        const rect = volumeRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const x = e.clientX - cx;
        const y = e.clientY - cy;

        // Atan2 returns angle in radians from -PI to PI relative to positive x-axis (Right)
        // 0 = Right, PI/2 = Bottom, PI = Left, -PI/2 = Top
        let angle = Math.atan2(y, x) * (180 / Math.PI);

        // Normalize to 0-360 positive
        if (angle < 0) angle += 360;

        // Now map 0-360 to our range interaction.
        // Valid range: 135deg to 405deg (which is 45deg mod 360)
        // Wait, standard atan2:
        // Right (0), Bottom (90), Left (180), Top (-90/270)
        // We want Bottom Left (135) to Bottom Right (45 or 405)

        // Transformation to shift origin to Bottom Left being 0?
        // Let's rely on raw degrees.
        // 135 (Start Vol 0) -> 180 -> 270 (Top) -> 360 (Right) -> 405 (End Vol 1)

        // To handle the gap at the bottom (45deg to 135deg is the dead zone):
        // If angle is between 45 and 135, snap to closest bound?

        let effectiveAngle = angle;
        if (effectiveAngle >= 45 && effectiveAngle < 135) {
            // In the dead zone
            return; // Ignore or snap?
        }

        // Remap for calculation
        // If we are from 135 to 360: value = (angle - 135)
        // If we are from 0 to 45: value = (360 - 135) + angle = 225 + angle.

        let relativeAngle = 0;
        if (effectiveAngle >= 135) {
            relativeAngle = effectiveAngle - 135;
        } else {
            relativeAngle = (360 - 135) + effectiveAngle;
        }

        const totalRange = 270;
        let newVolume = Math.min(Math.max(relativeAngle / totalRange, 0), 1);

        setVolume(newVolume);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDraggingVolume(true);
        calculateVolumeFromEvent(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDraggingVolume) {
            calculateVolumeFromEvent(e);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDraggingVolume(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Render SVG Paths
    const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
        const start = valueToPoint(0); // This is wrong implementation for generic arc
        // Helpers for arc command: A rx ry x-axis-rotation large-arc-flag sweep-flag x y

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = x + r * Math.cos(startRad);
        const y1 = y + r * Math.sin(startRad);

        const x2 = x + r * Math.cos(endRad);
        const y2 = y + r * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", x1, y1,
            "A", r, r, 0, largeArcFlag, 1, x2, y2
        ].join(" ");
    };

    // Angles for display
    const ARC_START = 135;
    const ARC_END = 405;
    const ARC_CURRENT = ARC_START + (volume * (ARC_END - ARC_START));

    const knobPos = valueToPoint(volume);

    const formatTime = (time: number) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(Number(e.target.value));
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex flex-col animate-in slide-in-from-bottom duration-500 touch-none h-[100dvh] overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                    src={currentTrack.coverUrl}
                    className="w-full h-full object-cover opacity-30 blur-3xl scale-125 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 mt-safe shrink-0">
                <button
                    onClick={toggleExpanded}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                    <ChevronDown size={24} />
                </button>
                <div className="text-center">
                    <h3 className="text-xs font-bold tracking-[0.2em] text-zuno-muted uppercase">Tocando</h3>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">{currentTrack.album || 'Single'}</p>
                </div>
                <button
                    className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    onClick={() => {
                        toast.show('Downloading...', 'info');
                        DownloadService.downloadTrack(currentTrack);
                    }}
                >
                    <Download size={24} />
                </button>
            </div>

            {/* Main Content (Orb + Volume) */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0">

                {/* Container for Orb and Volume Slider */}
                <div
                    className="relative w-[35vh] h-[35vh] max-w-[280px] max-h-[280px] md:w-80 md:h-80 flex items-center justify-center select-none"
                    ref={volumeRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* SVG Layer for Volume */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 320 320">
                        {/* Background Track */}
                        <path
                            d={describeArc(center, center, radius, ARC_START, ARC_END)}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                        {/* Active Progress */}
                        <path
                            d={describeArc(center, center, radius, ARC_START, ARC_CURRENT)}
                            fill="none"
                            stroke="#1ED760"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            className="drop-shadow-[0_0_10px_rgba(30,215,96,0.5)]"
                        />
                    </svg>

                    {/* Icons */}
                    <div className={`absolute top-0 transform -translate-y-6 md:-translate-y-8 text-white/50 transition-opacity ${isDraggingVolume ? 'opacity-100' : 'opacity-50'}`}>
                        <Volume2 size={24} />
                    </div>
                    <div className={`absolute bottom-0 transform translate-y-6 md:translate-y-8 text-white/50 transition-opacity ${isDraggingVolume ? 'opacity-100' : 'opacity-50'}`}>
                        <VolumeX size={24} />
                    </div>

                    {/* Central Orb (Album Art) */}
                    <div className="relative w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-zuno-card/50 shadow-2xl shadow-zuno-accent/20 z-10 pointer-events-none">
                        <img src={currentTrack.coverUrl} alt="Album Art" className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_30s_linear_infinite]' : ''}`} />
                    </div>

                    {/* Draggable Knob */}
                    <div
                        className="absolute w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center z-20 cursor-grab active:cursor-grabbing transition-transform"
                        style={{
                            left: `calc(${(knobPos.x / 320) * 100}% - ${isDraggingVolume ? 20 : 16}px)`, // Dynamic offset based on size? simplified: just center it properly
                            top: `calc(${(knobPos.y / 320) * 100}% - ${isDraggingVolume ? 20 : 16}px)`,
                            transform: isDraggingVolume ? 'scale(1.2)' : 'scale(1)'
                        }}
                    >
                        <span className="text-black text-[8px] md:text-[10px] font-bold font-mono">{Math.round(volume * 100)}</span>
                    </div>
                </div>

                <div className="mt-4 md:mt-16 text-center space-y-1 md:space-y-2 shrink-0">
                    <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight line-clamp-1 px-4">{currentTrack.title}</h2>
                    <p className="text-base md:text-lg text-zuno-muted font-medium">{currentTrack.artist}</p>
                </div>
            </div>

            {/* Bottom Controls (Glass Card) */}
            {/* Bottom Controls (Green Glass Card) */}
            <div className="relative z-10 p-4 md:p-6 pb-safe md:pb-12 shrink-0">
                <div className="bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] md:rounded-[40px] p-4 md:p-8 shadow-2xl overflow-hidden relative">

                    {/* Subtle Green Tint Glow */}
                    <div className="absolute inset-0 bg-zuno-accent/5 pointer-events-none mix-blend-overlay" />

                    {/* Row 1: Time & Waveform Scrubber */}
                    <div className="flex items-center gap-4 mb-6 md:mb-8 relative z-10">
                        <span className="text-xs font-mono font-medium text-white/60 w-10 text-right">{formatTime(currentTime)}</span>

                        <div className="relative flex-1 h-12 flex items-center justify-center gap-[3px] group">
                            {/* Visual Waveform Bars */}
                            {Array.from({ length: 40 }).map((_, i) => {
                                const progress = (currentTime / (duration || 1));
                                const isPast = (i / 40) < progress;
                                return (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full transition-all duration-300 ${isPast ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`}
                                        style={{
                                            height: isPlaying
                                                ? `${Math.max(30, Math.random() * 100)}%`
                                                : `${30 + Math.sin(i * 0.5) * 20}%`,
                                        }}
                                    />
                                );
                            })}

                            {/* Functional Seek Input Overlay */}
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                        </div>

                        <span className="text-xs font-mono font-medium text-white/60 w-10">{formatTime(duration)}</span>
                    </div>

                    {/* Row 2: Main Controls */}
                    <div className="flex items-center justify-between px-2 md:px-6 relative z-10">
                        <button className="text-white/40 hover:text-white transition-colors p-2"><Shuffle size={20} /></button>

                        <div className="flex items-center gap-6 md:gap-10">
                            <button onClick={prevTrack} className="text-white hover:text-zuno-accent transition-colors opacity-80 hover:opacity-100">
                                <SkipBack size={24} className="md:w-7 md:h-7" fill="currentColor" strokeWidth={0} />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
                            >
                                {isPlaying ? <Pause size={28} className="md:w-8 md:h-8" fill="currentColor" strokeWidth={0} /> : <Play size={28} className="md:w-8 md:h-8" fill="currentColor" strokeWidth={0} className="ml-1" />}
                            </button>

                            <button onClick={nextTrack} className="text-white hover:text-zuno-accent transition-colors opacity-80 hover:opacity-100">
                                <SkipForward size={24} className="md:w-7 md:h-7" fill="currentColor" strokeWidth={0} />
                            </button>
                        </div>

                        <button className="text-white/40 hover:text-white transition-colors p-2"><Repeat size={20} /></button>
                    </div>
                </div>
            </div>

        </div>
    );
};
