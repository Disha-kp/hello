import { useState, useEffect, useRef, useCallback } from 'react';

export default function useVoiceAssistant() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const isSpeakingRef = useRef(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
                if (!isSpeakingRef.current) {
                    try { recognition.start(); } catch (e) { }
                }
            };

            recognition.onresult = (event) => {
                if (isSpeakingRef.current) return;
                const text = event.results[event.results.length - 1][0].transcript;
                setTranscript(text);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Web Speech API not supported in this browser.");
        }
    }, []);

    const speak = useCallback((text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(true);
            isSpeakingRef.current = true;

            const utterance = new SpeechSynthesisUtterance(text);
            window.speechUtterance = utterance; // CRITICAL HACK

            utterance.onend = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                try {
                    if (recognitionRef.current) {
                        recognitionRef.current.start();
                    }
                } catch (e) {
                    console.log("Mic is already running or blocked:", e);
                }
            };

            setTimeout(() => {
                if (isSpeakingRef.current) {
                    isSpeakingRef.current = false;
                    setIsSpeaking(false);
                    try {
                        if (recognitionRef.current) {
                            recognitionRef.current.start();
                        }
                    } catch (e) { }
                }
            }, 5000);

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const listen = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript('');
            try { recognitionRef.current.start(); } catch (e) { }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        isSpeaking,
        speak,
        listen,
        stopListening,
        setTranscript
    };
}
