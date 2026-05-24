export function calculateConfidenceSignals({ eyeContact = 0, hesitation = 0, attention = 0 }) {
  const speechFlow = Math.max(0, 100 - hesitation);
  const confidence = Math.round(eyeContact * 0.35 + speechFlow * 0.3 + attention * 0.35);

  return {
    eyeContact,
    speechFlow,
    attention,
    confidence
  };
}
