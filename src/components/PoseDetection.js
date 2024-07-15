import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import { useToast } from "../context/ToastContext";

const PoseDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isCrouching, setIsCrouching] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const lastDetectionTimeRef = useRef(0);
  const nosePositions = useRef([]);
  const shoulderPositions = useRef([]);
  const lastShoulderCaptureTimeRef = useRef(0);

  const showToast = useToast();

  useEffect(() => {
    const setupCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          if (isVideoActive) detectPose();
        };
      }
    };

    const setupVoiceRecognition = () => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "es-ES";

        recognitionRef.current.onresult = (event) => {
          if (isVoiceActive) {
            const lastResult = event.results[event.results.length - 1];
            const command = lastResult[0].transcript.trim().toLowerCase();
            console.log("Command detected:", command);

            if (command === "Jump") {
              console.log('User said Jump"');
              setIsJumping(true);
            } else if (command === "crouch") {
              console.log('User said crouch"');
              setIsCrouching(true);
            }
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "no-speech" || event.error === "aborted") {
            setIsVoiceActive(false);
          }
        };

        recognitionRef.current.onend = () => {
          if (isVoiceActive) {
            recognitionRef.current.start();
          }
        };
      } else {
        console.warn("Reconocimiento de voz no soportado en este navegador.");
      }
    };

    const detectPose = async () => {
      const net = await posenet.load();
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const poseDetectionFrame = async (timestamp) => {
        if (isVideoActive) {
          if (timestamp - lastDetectionTimeRef.current >= 200) {
            lastDetectionTimeRef.current = timestamp;

            tf.engine().startScope();
            const pose = await net.estimateSinglePose(video, {
              flipHorizontal: false,
            });
            tf.engine().endScope();

            ctx.clearRect(0, 0, video.width, video.height);
            ctx.drawImage(video, 0, 0, video.width, video.height);
            drawKeypoints(pose.keypoints, 0.6, ctx);

            const nose = pose.keypoints.find((point) => point.part === "nose");
            const leftShoulder = pose.keypoints.find(
              (point) => point.part === "leftShoulder"
            );
            const rightShoulder = pose.keypoints.find(
              (point) => point.part === "rightShoulder"
            );

            if (nose && leftShoulder && rightShoulder) {
              const averageShoulderY =
                (leftShoulder.position.y + rightShoulder.position.y) / 2;
              const noseY = nose.position.y;

              nosePositions.current.push(noseY);
              if (nosePositions.current.length > 5) {
                nosePositions.current.shift();
              }

              const currentTime = new Date().getTime();
              if (currentTime - lastShoulderCaptureTimeRef.current >= 2000) {
                shoulderPositions.current.push(averageShoulderY);
                if (shoulderPositions.current.length > 2) {
                  shoulderPositions.current.shift();
                }
                lastShoulderCaptureTimeRef.current = currentTime;
              }

              const averageNoseY =
                nosePositions.current.reduce((a, b) => a + b, 0) /
                nosePositions.current.length;

              const averageShoulderY2SecondsAgo =
                shoulderPositions.current.reduce((a, b) => a + b, 0) /
                shoulderPositions.current.length;

              const variation = Math.abs(averageNoseY - noseY);

              if (variation > 300) {
                if (noseY > averageShoulderY2SecondsAgo + 20) {
                  console.log("User has crouched!");
                  setIsCrouching(true);
                  setIsJumping(false);
                  showToast("User has crouched!", "crouch");
                } else if (noseY < averageShoulderY2SecondsAgo - 20) {
                  console.log("User has jumped!");
                  setIsJumping(true);
                  setIsCrouching(false);
                  showToast("User has jumped!", "jump");
                } else {
                  setIsCrouching(false);
                  setIsJumping(false);
                }
              } else {
                setIsCrouching(false);
                setIsJumping(false);
              }
            }
          }

          requestAnimationFrame(poseDetectionFrame);
        }
      };

      requestAnimationFrame(poseDetectionFrame);
    };

    setupCamera();
    setupVoiceRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoActive, isVoiceActive]);

  const toggleVoiceRecognition = () => {
    if (recognitionRef.current) {
      if (isVoiceActive) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
      setIsVoiceActive(!isVoiceActive);
    }
  };

  const toggleVideoProcessing = () => {
    setIsVideoActive(!isVideoActive);
  };

  const drawKeypoints = (keypoints, minConfidence, ctx) => {
    keypoints.forEach((point) => {
      if (point.score > minConfidence) {
        ctx.beginPath();
        ctx.arc(point.position.x, point.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });
  };

  return (
    <div>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} width="640" height="480" />
      <div>
        <button onClick={toggleVoiceRecognition}>
          {isVoiceActive ? "Stop Voice Commands" : "Start Voice Commands"}
        </button>
        <button onClick={toggleVideoProcessing}>
          {isVideoActive ? "Stop Video Commands" : "Start Video Commands"}
        </button>
      </div>
    </div>
  );
};

export default PoseDetection;
