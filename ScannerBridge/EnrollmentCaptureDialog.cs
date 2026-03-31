using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace ScannerBridge
{
    internal sealed class EnrollmentCaptureDialog : Form, DPFP.Capture.EventHandler
    {
        private readonly Label _promptLabel;
        private readonly Label _statusLabel;
        private readonly TextBox _logTextBox;
        private DPFP.Capture.Capture _capturer;
        private DPFP.Processing.Enrollment _enroller;
        private int _enrollmentAttemptNumber;
        private int _capturedSampleCount;
        private int _acceptedSampleCount;
        private DPFP.Capture.CaptureFeedback _lastCaptureFeedback;
        private string _readerSerialNumber;

        public EnrollmentCaptureDialog()
        {
            Text = "Fingerprint Enrollment";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            ClientSize = new Size(680, 410);

            _enrollmentAttemptNumber = 1;
            _lastCaptureFeedback = DPFP.Capture.CaptureFeedback.None;
            _readerSerialNumber = string.Empty;

            _promptLabel = new Label();
            _promptLabel.AutoSize = false;
            _promptLabel.Location = new Point(16, 16);
            _promptLabel.Size = new Size(648, 40);
            _promptLabel.Text = "Place the same finger on the reader until enrollment completes.";

            _statusLabel = new Label();
            _statusLabel.AutoSize = false;
            _statusLabel.Location = new Point(16, 62);
            _statusLabel.Size = new Size(648, 36);
            _statusLabel.Text = "Preparing scanner...";

            _logTextBox = new TextBox();
            _logTextBox.Location = new Point(16, 112);
            _logTextBox.Multiline = true;
            _logTextBox.ScrollBars = ScrollBars.Vertical;
            _logTextBox.ReadOnly = true;
            _logTextBox.Size = new Size(648, 250);

            Button cancelButton = new Button();
            cancelButton.Text = "Cancel";
            cancelButton.Location = new Point(584, 372);
            cancelButton.Size = new Size(80, 28);
            cancelButton.Click += delegate { Close(); };

            Controls.Add(_promptLabel);
            Controls.Add(_statusLabel);
            Controls.Add(_logTextBox);
            Controls.Add(cancelButton);

            Load += OnLoad;
            FormClosed += OnFormClosed;
        }

        public string TemplateBase64 { get; private set; }

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
                _enroller = new DPFP.Processing.Enrollment();
                SetPrompt("Scan the same finger repeatedly. Keep it centered and use steady pressure.");
                UpdateStatus();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    this,
                    "Unable to initialize the fingerprint reader." + Environment.NewLine + ex.Message,
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
                SetPrompt("Using the fingerprint reader, scan the selected finger.");
                Log("Capture started for enrollment attempt #" + _enrollmentAttemptNumber + ".");
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    this,
                    "Unable to start capture." + Environment.NewLine + ex.Message,
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

            try
            {
                Log("The fingerprint feature set was created.");
                _enroller.AddFeatures(features);
                _acceptedSampleCount += 1;
                Log(
                    "Sample accepted for enrollment. Accepted samples this attempt: " +
                    _acceptedSampleCount + ".");
            }
            finally
            {
                UpdateStatus();

                switch (_enroller.TemplateStatus)
                {
                    case DPFP.Processing.Enrollment.Status.Ready:
                        TemplateBase64 = SerializeTemplate(_enroller.Template);
                        SetPrompt("Template created successfully.");
                        Log("Fingerprint template is ready.");
                        Log("Enrollment attempt #" + _enrollmentAttemptNumber + " completed successfully.");
                        StopCapture();
                        DialogResult = DialogResult.OK;
                        Close();
                        break;

                    case DPFP.Processing.Enrollment.Status.Insufficient:
                        Log("Need " + _enroller.FeaturesNeeded + " more good sample(s) from the same finger.");
                        break;

                    case DPFP.Processing.Enrollment.Status.Failed:
                        HandleEnrollmentFailure();
                        break;

                    case DPFP.Processing.Enrollment.Status.Unknown:
                        Log("Enrollment status is unknown. Keep using the same finger.");
                        break;
                }
            }
        }

        private DPFP.FeatureSet ExtractFeatures(DPFP.Sample sample)
        {
            DPFP.Processing.FeatureExtraction extractor = new DPFP.Processing.FeatureExtraction();
            DPFP.Capture.CaptureFeedback feedback = DPFP.Capture.CaptureFeedback.None;
            DPFP.FeatureSet features = new DPFP.FeatureSet();
            extractor.CreateFeatureSet(
                sample,
                DPFP.Processing.DataPurpose.Enrollment,
                ref feedback,
                ref features);

            _lastCaptureFeedback = feedback;
            UpdateStatus();

            if (feedback == DPFP.Capture.CaptureFeedback.Good)
            {
                return features;
            }

            Log("This sample could not be used for enrollment. Reason: " + DescribeCaptureFeedback(feedback) + ".");
            SetPrompt("Adjust the same finger and try again.");
            return null;
        }

        private static string SerializeTemplate(DPFP.Template template)
        {
            using (MemoryStream stream = new MemoryStream())
            {
                template.Serialize(stream);
                return Convert.ToBase64String(stream.ToArray());
            }
        }

        private void UpdateStatus()
        {
            uint featuresNeeded = _enroller == null ? 0u : _enroller.FeaturesNeeded;
            SetStatus(
                "Attempt " + _enrollmentAttemptNumber +
                " | Accepted: " + _acceptedSampleCount +
                " | Remaining: " + featuresNeeded +
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
            Log("The fingerprint sample was captured. Total captured samples: " + _capturedSampleCount + ".");
            SetPrompt("Scan the same fingerprint again.");
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
            _readerSerialNumber = readerSerialNumber ?? string.Empty;
            if (string.IsNullOrEmpty(_readerSerialNumber))
            {
                Log("The fingerprint reader was connected.");
                return;
            }

            Log("The fingerprint reader was connected. Reader serial: " + _readerSerialNumber + ".");
        }

        public void OnReaderDisconnect(object capture, string readerSerialNumber)
        {
            if (!string.IsNullOrEmpty(readerSerialNumber))
            {
                Log("The fingerprint reader was disconnected. Reader serial: " + readerSerialNumber + ".");
                return;
            }

            Log("The fingerprint reader was disconnected.");
        }

        public void OnSampleQuality(
            object capture,
            string readerSerialNumber,
            DPFP.Capture.CaptureFeedback captureFeedback)
        {
            _lastCaptureFeedback = captureFeedback;
            UpdateStatus();
            Log("Sample quality result: " + DescribeCaptureFeedback(captureFeedback) + ".");
        }

        private void HandleEnrollmentFailure()
        {
            _enroller.Clear();
            StopCapture();
            TemplateBase64 = null;
            Log("Enrollment failed. The SDK reported status 'Failed' without a more detailed error code.");
            Log(BuildFailureHint());
            _acceptedSampleCount = 0;
            _lastCaptureFeedback = DPFP.Capture.CaptureFeedback.None;
            _enrollmentAttemptNumber += 1;
            UpdateStatus();
            SetPrompt("Enrollment failed. Reposition the same finger and try again.");
            StartCapture();
        }

        private string BuildFailureHint()
        {
            string qualityMessage = DescribeCaptureFeedback(_lastCaptureFeedback);

            if (_lastCaptureFeedback != DPFP.Capture.CaptureFeedback.None &&
                _lastCaptureFeedback != DPFP.Capture.CaptureFeedback.Good)
            {
                return "Most recent quality issue: " + qualityMessage +
                    ". Try the same finger again with cleaner contact and steadier placement.";
            }

            return "Most often this means the SDK got usable samples, but they were not consistent enough to form one template. Keep using the exact same finger, place it flat in the center, and hold it steady until each capture finishes.";
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
    }
}
