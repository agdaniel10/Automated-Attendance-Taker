using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace ScannerBridge
{
    internal sealed class AttendanceVerificationDialog : Form, DPFP.Capture.EventHandler
    {
        private readonly Label _promptLabel;
        private readonly Label _statusLabel;
        private readonly TextBox _logTextBox;
        private readonly MatchingCandidate[] _candidates;
        private readonly int _templateCount;

        private DPFP.Capture.Capture _capturer;
        private DPFP.Verification.Verification _verificator;
        private DPFP.Capture.CaptureFeedback _lastCaptureFeedback;
        private int _capturedSampleCount;

        public AttendanceVerificationDialog(MatchingCandidate[] candidates)
        {
            _candidates = candidates ?? new MatchingCandidate[0];
            _templateCount = CountTemplates(_candidates);
            _lastCaptureFeedback = DPFP.Capture.CaptureFeedback.None;

            Text = "Attendance Verification";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            ClientSize = new Size(700, 430);

            _promptLabel = new Label();
            _promptLabel.AutoSize = false;
            _promptLabel.Location = new Point(16, 16);
            _promptLabel.Size = new Size(668, 40);
            _promptLabel.Text = "Place a registered finger on the reader for attendance verification.";

            _statusLabel = new Label();
            _statusLabel.AutoSize = false;
            _statusLabel.Location = new Point(16, 62);
            _statusLabel.Size = new Size(668, 36);
            _statusLabel.Text = "Preparing verification...";

            _logTextBox = new TextBox();
            _logTextBox.Location = new Point(16, 112);
            _logTextBox.Multiline = true;
            _logTextBox.ScrollBars = ScrollBars.Vertical;
            _logTextBox.ReadOnly = true;
            _logTextBox.Size = new Size(668, 270);

            Button cancelButton = new Button();
            cancelButton.Text = "Cancel";
            cancelButton.Location = new Point(604, 392);
            cancelButton.Size = new Size(80, 28);
            cancelButton.Click += delegate { Close(); };

            Controls.Add(_promptLabel);
            Controls.Add(_statusLabel);
            Controls.Add(_logTextBox);
            Controls.Add(cancelButton);

            Load += OnLoad;
            FormClosed += OnFormClosed;
        }

        public bool ScanCompleted { get; private set; }
        public bool MatchFound { get; private set; }
        public MatchingCandidate MatchedCandidate { get; private set; }
        public MatchingCandidateTemplate MatchedTemplate { get; private set; }
        public double Confidence { get; private set; }
        public int MatchFarAchieved { get; private set; }
        public string ResultMessage { get; private set; }

        private void OnLoad(object sender, EventArgs e)
        {
            InitCapture();
            StartCapture();
        }

        private void OnFormClosed(object sender, FormClosedEventArgs e)
        {
            StopCapture();
        }

        private void InitCapture()
        {
            try
            {
                _capturer = new DPFP.Capture.Capture();
                _capturer.EventHandler = this;
                _verificator = new DPFP.Verification.Verification();
                SetPrompt("Scan a registered finger once. Matching will run against " + _templateCount + " enrolled template(s).");
                UpdateStatus();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    this,
                    "Unable to initialize fingerprint verification." + Environment.NewLine + ex.Message,
                    "Scanner Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                DialogResult = DialogResult.Abort;
                Close();
            }
        }

        private void StartCapture()
        {
            if (_capturer == null)
            {
                return;
            }

            try
            {
                _capturer.StartCapture();
                Log("Verification capture started.");
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    this,
                    "Unable to start verification capture." + Environment.NewLine + ex.Message,
                    "Scanner Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                DialogResult = DialogResult.Abort;
                Close();
            }
        }

        private void StopCapture()
        {
            if (_capturer == null)
            {
                return;
            }

            try
            {
                _capturer.StopCapture();
            }
            catch
            {
            }
        }

        private void ProcessSample(DPFP.Sample sample)
        {
            DPFP.FeatureSet features = ExtractFeatures(sample);
            if (features == null)
            {
                return;
            }

            VerificationSelection selection = FindBestMatch(features);
            ScanCompleted = true;
            StopCapture();

            if (selection.MatchFound)
            {
                MatchFound = true;
                MatchedCandidate = selection.Candidate;
                MatchedTemplate = selection.Template;
                MatchFarAchieved = selection.FarAchieved;
                Confidence = CalculateConfidence(selection.FarAchieved, _verificator.FARRequested);
                ResultMessage =
                    "Matched " + selection.Candidate.name +
                    " using " + selection.Template.fingerPosition +
                    ". FAR=" + selection.FarAchieved +
                    ", confidence=" + Confidence.ToString("0.0") + "%.";
                Log(ResultMessage);
            }
            else
            {
                MatchFound = false;
                Confidence = 0;
                ResultMessage = selection.BestAttemptMessage;
                Log(ResultMessage);
            }

            DialogResult = DialogResult.OK;
            Close();
        }

        private DPFP.FeatureSet ExtractFeatures(DPFP.Sample sample)
        {
            DPFP.Processing.FeatureExtraction extractor = new DPFP.Processing.FeatureExtraction();
            DPFP.Capture.CaptureFeedback feedback = DPFP.Capture.CaptureFeedback.None;
            DPFP.FeatureSet features = new DPFP.FeatureSet();
            extractor.CreateFeatureSet(
                sample,
                DPFP.Processing.DataPurpose.Verification,
                ref feedback,
                ref features);

            _lastCaptureFeedback = feedback;
            UpdateStatus();

            if (feedback == DPFP.Capture.CaptureFeedback.Good)
            {
                return features;
            }

            Log("This verification sample could not be used. Reason: " + DescribeCaptureFeedback(feedback) + ".");
            SetPrompt("Adjust the finger and try again.");
            return null;
        }

        private VerificationSelection FindBestMatch(DPFP.FeatureSet features)
        {
            VerificationSelection bestSelection = new VerificationSelection();
            bestSelection.FarAchieved = int.MaxValue;

            int comparedTemplateCount = 0;

            for (int candidateIndex = 0; candidateIndex < _candidates.Length; candidateIndex++)
            {
                MatchingCandidate candidate = _candidates[candidateIndex];
                MatchingCandidateTemplate[] templates =
                    candidate == null || candidate.templates == null
                        ? new MatchingCandidateTemplate[0]
                        : candidate.templates;

                for (int templateIndex = 0; templateIndex < templates.Length; templateIndex++)
                {
                    MatchingCandidateTemplate templateInfo = templates[templateIndex];
                    DPFP.Template template = TryDeserializeTemplate(templateInfo);
                    if (template == null)
                    {
                        continue;
                    }

                    comparedTemplateCount += 1;

                    DPFP.Verification.Verification.Result result =
                        DPFP.Verification.Verification.Verify(
                            features,
                            template,
                            _verificator.FARRequested);

                    if (result.Verified && result.FARAchieved < bestSelection.FarAchieved)
                    {
                        bestSelection.MatchFound = true;
                        bestSelection.Candidate = candidate;
                        bestSelection.Template = templateInfo;
                        bestSelection.FarAchieved = result.FARAchieved;
                    }
                    else if (!bestSelection.MatchFound && result.FARAchieved < bestSelection.FarAchieved)
                    {
                        bestSelection.Candidate = candidate;
                        bestSelection.Template = templateInfo;
                        bestSelection.FarAchieved = result.FARAchieved;
                    }
                }
            }

            if (bestSelection.MatchFound)
            {
                bestSelection.BestAttemptMessage =
                    "Match found after comparing against " + comparedTemplateCount + " template(s).";
                return bestSelection;
            }

            if (bestSelection.Candidate != null && bestSelection.Template != null)
            {
                bestSelection.BestAttemptMessage =
                    "No verified match was found. Closest candidate was " +
                    bestSelection.Candidate.name +
                    " on " + bestSelection.Template.fingerPosition +
                    " with FAR=" + bestSelection.FarAchieved + ".";
                return bestSelection;
            }

            bestSelection.BestAttemptMessage =
                "No match was found and no valid templates were available for comparison.";
            return bestSelection;
        }

        private static DPFP.Template TryDeserializeTemplate(MatchingCandidateTemplate templateInfo)
        {
            if (templateInfo == null || string.IsNullOrEmpty(templateInfo.templateBase64))
            {
                return null;
            }

            try
            {
                byte[] templateBytes = Convert.FromBase64String(templateInfo.templateBase64);
                using (MemoryStream stream = new MemoryStream(templateBytes))
                {
                    return new DPFP.Template(stream);
                }
            }
            catch
            {
                return null;
            }
        }

        private void UpdateStatus()
        {
            SetStatus(
                "Captured: " + _capturedSampleCount +
                " | Templates loaded: " + _templateCount +
                " | FAR requested: " + (_verificator == null ? 0 : _verificator.FARRequested) +
                " | Last quality: " + DescribeCaptureFeedback(_lastCaptureFeedback));
        }

        private void SetPrompt(string message)
        {
            SafeUi(delegate
            {
                _promptLabel.Text = message;
            });
        }

        private void SetStatus(string message)
        {
            SafeUi(delegate
            {
                _statusLabel.Text = message;
            });
        }

        private void Log(string message)
        {
            SafeUi(delegate
            {
                _logTextBox.AppendText(message + Environment.NewLine);
            });
        }

        private void SafeUi(MethodInvoker action)
        {
            if (InvokeRequired)
            {
                BeginInvoke(action);
                return;
            }

            action();
        }

        public void OnComplete(object capture, string readerSerialNumber, DPFP.Sample sample)
        {
            _capturedSampleCount += 1;
            Log("Verification sample captured.");
            ProcessSample(sample);
        }

        public void OnFingerGone(object capture, string readerSerialNumber)
        {
            Log("The finger was removed from the fingerprint reader.");
        }

        public void OnFingerTouch(object capture, string readerSerialNumber)
        {
            Log("The fingerprint reader was touched.");
        }

        public void OnReaderConnect(object capture, string readerSerialNumber)
        {
            Log("The fingerprint reader was connected.");
        }

        public void OnReaderDisconnect(object capture, string readerSerialNumber)
        {
            Log("The fingerprint reader was disconnected.");
        }

        public void OnSampleQuality(
            object capture,
            string readerSerialNumber,
            DPFP.Capture.CaptureFeedback captureFeedback)
        {
            _lastCaptureFeedback = captureFeedback;
            UpdateStatus();
            Log("Verification sample quality: " + DescribeCaptureFeedback(captureFeedback) + ".");
        }

        private static int CountTemplates(MatchingCandidate[] candidates)
        {
            int count = 0;

            for (int candidateIndex = 0; candidateIndex < candidates.Length; candidateIndex++)
            {
                MatchingCandidate candidate = candidates[candidateIndex];
                if (candidate == null || candidate.templates == null)
                {
                    continue;
                }

                count += candidate.templates.Length;
            }

            return count;
        }

        private static double CalculateConfidence(int farAchieved, int farRequested)
        {
            if (farRequested <= 0)
            {
                return 0;
            }

            double boundedFar = Math.Min(farAchieved, farRequested);
            double confidence = (1.0 - (boundedFar / farRequested)) * 100.0;
            if (confidence < 0)
            {
                confidence = 0;
            }

            return Math.Round(confidence, 1);
        }

        private static string DescribeCaptureFeedback(DPFP.Capture.CaptureFeedback feedback)
        {
            switch (feedback)
            {
                case DPFP.Capture.CaptureFeedback.Good:
                    return "Good";
                case DPFP.Capture.CaptureFeedback.None:
                    return "Not yet rated";
                case DPFP.Capture.CaptureFeedback.TooLight:
                    return "Too light on the reader";
                case DPFP.Capture.CaptureFeedback.TooDark:
                    return "Too much pressure or image too dark";
                case DPFP.Capture.CaptureFeedback.TooNoisy:
                    return "Noisy scan";
                case DPFP.Capture.CaptureFeedback.LowContrast:
                    return "Low contrast";
                case DPFP.Capture.CaptureFeedback.NotEnoughFeatures:
                    return "Not enough fingerprint detail";
                case DPFP.Capture.CaptureFeedback.NoCentralRegion:
                    return "Finger not centered";
                case DPFP.Capture.CaptureFeedback.NoFinger:
                    return "No finger detected";
                case DPFP.Capture.CaptureFeedback.TooHigh:
                    return "Finger placed too high";
                case DPFP.Capture.CaptureFeedback.TooLow:
                    return "Finger placed too low";
                case DPFP.Capture.CaptureFeedback.TooLeft:
                    return "Finger placed too far left";
                case DPFP.Capture.CaptureFeedback.TooRight:
                    return "Finger placed too far right";
                case DPFP.Capture.CaptureFeedback.TooStrange:
                    return "Unusual finger position";
                case DPFP.Capture.CaptureFeedback.TooFast:
                    return "Finger moved too quickly";
                case DPFP.Capture.CaptureFeedback.TooSkewed:
                    return "Finger was skewed";
                case DPFP.Capture.CaptureFeedback.TooShort:
                    return "Touch was too short";
                case DPFP.Capture.CaptureFeedback.TooSlow:
                    return "Finger movement was too slow";
                case DPFP.Capture.CaptureFeedback.TooSmall:
                    return "Finger contact area was too small";
                default:
                    return feedback.ToString();
            }
        }

        private sealed class VerificationSelection
        {
            public bool MatchFound { get; set; }
            public MatchingCandidate Candidate { get; set; }
            public MatchingCandidateTemplate Template { get; set; }
            public int FarAchieved { get; set; }
            public string BestAttemptMessage { get; set; }
        }
    }
}
