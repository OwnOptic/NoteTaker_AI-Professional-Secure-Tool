import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconClose, IconMicrophone, IconVideo, IconInfo, IconScreenShare, IconVolume2 } from './Icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useFocusTrap } from '../hooks/useFocusTrap';
import Spinner from './Spinner';
import { useLocalization } from '../hooks/useLocalization';

interface MeetingModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFinish: (data: { transcript?: string; audioBase64?: string; audioMimeType?: string }, screenshots: string[]) => void;
    isProcessing: boolean;
}

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const MeetingModeModal: React.FC<MeetingModeModalProps> = ({ isOpen, onClose, onFinish, isProcessing }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();
    const [audioSource, setAudioSource] = useState<'mic' | 'system'>('mic');
    
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRecordingSystemAudio, setIsRecordingSystemAudio] = useState(false);
    
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [systemAudioStream, setSystemAudioStream] = useState<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const { t } = useLocalization();
    
    const timerRef = useRef<number | null>(null);
    const captureIntervalRef = useRef<number | null>(null);

    useFocusTrap(modalRef, isOpen, onClose);

    const cleanup = useCallback(() => {
        if (isListening) stopListening();
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        
        screenStream?.getTracks().forEach(track => track.stop());
        systemAudioStream?.getTracks().forEach(track => track.stop());
        
        setScreenStream(null);
        setSystemAudioStream(null);

        if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        
        setAudioSource('mic');
        setIsRecordingSystemAudio(false);

    }, [isListening, stopListening, screenStream, systemAudioStream]);
    
    useEffect(() => {
        if (isOpen) {
            setElapsedTime(0);
            setCapturedImages([]);
            setAudioSource('mic');
            startListening();
        } else {
            cleanup();
        }
    }, [isOpen, startListening, cleanup]);
    
    useEffect(() => {
        if (isOpen) {
            timerRef.current = window.setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isOpen]);
    
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleStopAndSave = async () => {
        if (audioSource === 'system' && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
                const audioBase64 = await blobToBase64(audioBlob);
                onFinish({ audioBase64, audioMimeType: audioBlob.type }, capturedImages);
                cleanup();
            };
            mediaRecorderRef.current.stop();
        } else {
            onFinish({ transcript }, capturedImages);
            cleanup();
        }
    };

    const handleCancel = () => {
        cleanup();
        onClose();
    };
    
    const handleToggleScreenShare = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
            if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
            setSystemAudioStream(null);
            if(audioSource === 'system') setAudioSource('mic');
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } });
                
                if (stream.getAudioTracks().length > 0) {
                    setSystemAudioStream(stream);
                } else {
                    setSystemAudioStream(null);
                }
                
                setScreenStream(stream);
                if (videoRef.current) videoRef.current.srcObject = stream;
                
                stream.getVideoTracks()[0].addEventListener('ended', () => {
                    setScreenStream(null);
                    setSystemAudioStream(null);
                    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
                    if(audioSource === 'system') setAudioSource('mic');
                });

                captureIntervalRef.current = window.setInterval(() => {
                   if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
                       const video = videoRef.current;
                       const canvas = canvasRef.current;
                       canvas.width = video.videoWidth;
                       canvas.height = video.videoHeight;
                       const ctx = canvas.getContext('2d');
                       if (ctx) {
                           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                           const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                           setCapturedImages(prev => [...prev, dataUrl]);
                       }
                   }
                }, 20000); // Capture every 20 seconds
            } catch (err) {
                console.error("Screen sharing error:", err);
                alert("Could not start screen sharing. Please ensure you grant permission, including audio if you want to transcribe it.");
            }
        }
    };

    useEffect(() => {
        if(audioSource === 'mic' && !isListening && isOpen) {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            startListening();
            setIsRecordingSystemAudio(false);
        } else if (audioSource === 'system' && systemAudioStream) {
            stopListening();
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(systemAudioStream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (event) => {
                if(event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            recorder.start();
            setIsRecordingSystemAudio(true);
        }
    }, [audioSource, systemAudioStream, isListening, startListening, stopListening, isOpen]);
    
    if (!isOpen) return null;

    const getTranscriptText = () => {
        if (audioSource === 'mic') {
            return transcript || (isListening ? t('meeting.transcript.listening') : t('meeting.transcript.paused'));
        }
        if(audioSource === 'system') {
            return isRecordingSystemAudio ? t('meeting.transcript.systemRecording') : t('meeting.transcript.systemPaused');
        }
        return '';
    };

    return (
         <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            role="dialog" aria-modal="true" aria-labelledby="meeting-title"
        >
            <div 
                ref={modalRef} tabIndex={-1}
                className="bg-secondary rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                style={{animationFillMode: 'forwards'}}
            >
                <header className="p-4 border-b border-tertiary flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <IconVideo className="w-7 h-7 text-accent"/>
                        <h2 id="meeting-title" className="text-lg font-bold">{t('meeting.title')}</h2>
                        {(isListening || isRecordingSystemAudio) && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" title={t('meeting.recording')}></div>}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 p-1 bg-primary rounded-md">
                           <button onClick={() => setAudioSource('mic')} className={`px-3 py-1 text-sm rounded flex items-center gap-2 ${audioSource === 'mic' ? 'bg-accent text-white' : 'hover:bg-tertiary'}`}><IconMicrophone className="w-4 h-4" /> Mic</button>
                           <button onClick={() => setAudioSource('system')} disabled={!systemAudioStream} className={`px-3 py-1 text-sm rounded flex items-center gap-2 ${audioSource === 'system' ? 'bg-accent text-white' : 'hover:bg-tertiary'} disabled:opacity-50 disabled:cursor-not-allowed`}><IconVolume2 className="w-4 h-4" /> System</button>
                        </div>
                         <span className="font-mono text-lg text-light" aria-label={`${t('meeting.elapsed')} ${formatTime(elapsedTime)}`}>{formatTime(elapsedTime)}</span>
                    </div>
                </header>
                
                 <div className="p-4 bg-primary/50 border-b border-tertiary flex items-start gap-3 text-sm text-subtle">
                    <IconInfo className="w-5 h-5 shrink-0 mt-0.5 text-highlight"/>
                    <p>{t('meeting.info')}</p>
                </div>

                <main className="flex-grow p-6 overflow-y-auto bg-primary grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold mb-2 text-light">{t('meeting.transcript.title')}</h3>
                        <div className="bg-secondary/30 rounded-md p-4 flex-grow overflow-y-auto">
                            <p className="text-light/90 whitespace-pre-wrap text-lg leading-relaxed">{getTranscriptText()}</p>
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                         <h3 className="text-lg font-semibold mb-2 text-light">{t('meeting.screenshare.title')}</h3>
                         <div className="bg-secondary/30 rounded-md flex-grow flex items-center justify-center relative aspect-video">
                            <video ref={videoRef} autoPlay muted className={`w-full h-full object-contain ${screenStream ? 'block' : 'hidden'}`}></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                            {!screenStream && (
                                <div className="text-center">
                                    <IconScreenShare className="w-16 h-16 text-tertiary mx-auto mb-4"/>
                                    <p className="text-subtle">{t('meeting.screenshare.info')}</p>
                                </div>
                            )}
                         </div>
                    </div>
                </main>

                <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-between items-center">
                    <div>
                        <button 
                            onClick={handleToggleScreenShare}
                            disabled={isProcessing}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 ${screenStream ? 'bg-red-600/80 hover:bg-red-600 text-white' : 'bg-tertiary hover:bg-secondary text-light'}`}
                        >
                            <IconScreenShare className="w-5 h-5"/>
                            {screenStream ? t('meeting.buttons.stopShare') : t('meeting.buttons.share')}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="px-6 py-2 text-sm font-semibold text-light bg-tertiary rounded-md hover:bg-secondary transition-colors"
                        >
                            {t('meeting.buttons.cancel')}
                        </button>
                        <button 
                            onClick={handleStopAndSave}
                            disabled={isProcessing}
                            className="px-6 py-2 text-sm font-semibold text-white bg-accent rounded-md hover:bg-highlight transition-colors flex items-center gap-2 disabled:bg-tertiary disabled:cursor-not-allowed"
                        >
                            {isProcessing ? <><Spinner /> {t('meeting.buttons.processing')}</> : t('meeting.buttons.save')}
                        </button>
                    </div>
                </footer>

                 <style>{`
                    @keyframes fade-in-scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                `}</style>
            </div>
        </div>
    );
};

export default MeetingModeModal;