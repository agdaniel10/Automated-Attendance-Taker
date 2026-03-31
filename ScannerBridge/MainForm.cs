using System;
using System.Drawing;
using System.Windows.Forms;

namespace ScannerBridge
{
    public sealed class MainForm : Form
    {
        private readonly ApiClient _apiClient = new ApiClient();
        private string _adminToken;

        private TextBox _baseUrlTextBox;
        private TextBox _operatorNameTextBox;
        private TextBox _passwordTextBox;
        private Label _loginStatusLabel;
        private TextBox _memberIdTextBox;
        private ComboBox _fingerPositionComboBox;
        private Button _captureEnrollButton;
        private TextBox _logTextBox;

        public MainForm()
        {
            InitializeLayout();
        }

        private void InitializeLayout()
        {
            Text = "Attendance Scanner Bridge";
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(760, 520);
            MinimumSize = new Size(760, 520);

            Label titleLabel = new Label();
            titleLabel.Text = "Fingerprint Enrollment Bridge";
            titleLabel.Font = new Font(Font.FontFamily, 14.0f, FontStyle.Bold);
            titleLabel.Location = new Point(16, 16);
            titleLabel.Size = new Size(360, 28);

            GroupBox loginGroup = new GroupBox();
            loginGroup.Text = "Backend Login";
            loginGroup.Location = new Point(16, 56);
            loginGroup.Size = new Size(728, 152);

            Label baseUrlLabel = new Label();
            baseUrlLabel.Text = "API Base URL";
            baseUrlLabel.Location = new Point(16, 28);
            baseUrlLabel.Size = new Size(96, 20);

            _baseUrlTextBox = new TextBox();
            _baseUrlTextBox.Location = new Point(132, 24);
            _baseUrlTextBox.Size = new Size(320, 24);
            _baseUrlTextBox.Text = "http://localhost:5000";

            Label operatorLabel = new Label();
            operatorLabel.Text = "Operator Name";
            operatorLabel.Location = new Point(16, 64);
            operatorLabel.Size = new Size(96, 20);

            _operatorNameTextBox = new TextBox();
            _operatorNameTextBox.Location = new Point(132, 60);
            _operatorNameTextBox.Size = new Size(200, 24);
            _operatorNameTextBox.Text = "Admin Operator";

            Label passwordLabel = new Label();
            passwordLabel.Text = "Admin Password";
            passwordLabel.Location = new Point(16, 100);
            passwordLabel.Size = new Size(104, 20);

            _passwordTextBox = new TextBox();
            _passwordTextBox.Location = new Point(132, 96);
            _passwordTextBox.Size = new Size(200, 24);
            _passwordTextBox.UseSystemPasswordChar = true;

            Button loginButton = new Button();
            loginButton.Text = "Login";
            loginButton.Location = new Point(472, 24);
            loginButton.Size = new Size(104, 32);
            loginButton.Click += LoginButton_Click;

            _loginStatusLabel = new Label();
            _loginStatusLabel.Text = "Not logged in.";
            _loginStatusLabel.Location = new Point(472, 68);
            _loginStatusLabel.Size = new Size(232, 52);

            loginGroup.Controls.Add(baseUrlLabel);
            loginGroup.Controls.Add(_baseUrlTextBox);
            loginGroup.Controls.Add(operatorLabel);
            loginGroup.Controls.Add(_operatorNameTextBox);
            loginGroup.Controls.Add(passwordLabel);
            loginGroup.Controls.Add(_passwordTextBox);
            loginGroup.Controls.Add(loginButton);
            loginGroup.Controls.Add(_loginStatusLabel);

            GroupBox enrollmentGroup = new GroupBox();
            enrollmentGroup.Text = "Enroll Fingerprint";
            enrollmentGroup.Location = new Point(16, 224);
            enrollmentGroup.Size = new Size(728, 112);

            Label memberIdLabel = new Label();
            memberIdLabel.Text = "Member ID";
            memberIdLabel.Location = new Point(16, 32);
            memberIdLabel.Size = new Size(96, 20);

            _memberIdTextBox = new TextBox();
            _memberIdTextBox.Location = new Point(132, 28);
            _memberIdTextBox.Size = new Size(320, 24);

            Label fingerLabel = new Label();
            fingerLabel.Text = "Finger Position";
            fingerLabel.Location = new Point(16, 68);
            fingerLabel.Size = new Size(96, 20);

            _fingerPositionComboBox = new ComboBox();
            _fingerPositionComboBox.DropDownStyle = ComboBoxStyle.DropDownList;
            _fingerPositionComboBox.Location = new Point(132, 64);
            _fingerPositionComboBox.Size = new Size(200, 24);
            _fingerPositionComboBox.Items.AddRange(new object[]
            {
                "LEFT_THUMB",
                "LEFT_INDEX",
                "LEFT_MIDDLE",
                "RIGHT_THUMB",
                "RIGHT_INDEX",
                "RIGHT_MIDDLE"
            });
            _fingerPositionComboBox.SelectedIndex = 0;

            _captureEnrollButton = new Button();
            _captureEnrollButton.Text = "Capture and Enroll";
            _captureEnrollButton.Location = new Point(472, 40);
            _captureEnrollButton.Size = new Size(160, 36);
            _captureEnrollButton.Click += CaptureEnrollButton_Click;

            enrollmentGroup.Controls.Add(memberIdLabel);
            enrollmentGroup.Controls.Add(_memberIdTextBox);
            enrollmentGroup.Controls.Add(fingerLabel);
            enrollmentGroup.Controls.Add(_fingerPositionComboBox);
            enrollmentGroup.Controls.Add(_captureEnrollButton);

            GroupBox logGroup = new GroupBox();
            logGroup.Text = "Activity Log";
            logGroup.Location = new Point(16, 352);
            logGroup.Size = new Size(728, 152);

            _logTextBox = new TextBox();
            _logTextBox.Location = new Point(16, 24);
            _logTextBox.Multiline = true;
            _logTextBox.ReadOnly = true;
            _logTextBox.ScrollBars = ScrollBars.Vertical;
            _logTextBox.Size = new Size(696, 112);

            logGroup.Controls.Add(_logTextBox);

            Controls.Add(titleLabel);
            Controls.Add(loginGroup);
            Controls.Add(enrollmentGroup);
            Controls.Add(logGroup);
        }

        private void LoginButton_Click(object sender, EventArgs e)
        {
            string baseUrl = _baseUrlTextBox.Text.Trim();
            string operatorName = _operatorNameTextBox.Text.Trim();
            string password = _passwordTextBox.Text;

            if (string.IsNullOrEmpty(baseUrl))
            {
                MessageBox.Show(this, "Enter the API base URL.", "Login", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(password))
            {
                MessageBox.Show(this, "Enter the admin password.", "Login", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            UseWaitCursor = true;
            try
            {
                LoginResult result = _apiClient.Login(baseUrl, operatorName, password);
                _adminToken = result.Token;
                _loginStatusLabel.Text = "Logged in as " + result.OperatorName;
                Log("Login successful for operator: " + result.OperatorName);
            }
            catch (Exception ex)
            {
                _adminToken = null;
                _loginStatusLabel.Text = "Login failed.";
                Log("Login failed: " + ex.Message);
                MessageBox.Show(this, ex.Message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private void CaptureEnrollButton_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(_adminToken))
            {
                MessageBox.Show(this, "Login to the backend first.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            string memberId = _memberIdTextBox.Text.Trim();
            if (string.IsNullOrEmpty(memberId))
            {
                MessageBox.Show(this, "Enter the member ID to enroll.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            string fingerPosition = Convert.ToString(_fingerPositionComboBox.SelectedItem);
            if (string.IsNullOrEmpty(fingerPosition))
            {
                MessageBox.Show(this, "Choose the finger position being enrolled.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using (EnrollmentCaptureDialog dialog = new EnrollmentCaptureDialog())
            {
                DialogResult captureResult = dialog.ShowDialog(this);
                if (captureResult != DialogResult.OK)
                {
                    Log("Fingerprint capture was cancelled or did not complete.");
                    return;
                }

                string templateBase64 = dialog.TemplateBase64;
                if (string.IsNullOrEmpty(templateBase64))
                {
                    Log("Capture completed without a template.");
                    MessageBox.Show(this, "No fingerprint template was produced.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                UseWaitCursor = true;
                try
                {
                    _apiClient.EnrollBiometric(
                        _baseUrlTextBox.Text.Trim(),
                        _adminToken,
                        memberId,
                        fingerPosition,
                        templateBase64);

                    Log("Enrollment saved for member " + memberId + " (" + fingerPosition + ").");
                    MessageBox.Show(this, "Fingerprint enrolled successfully.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    Log("Enrollment failed: " + ex.Message);
                    MessageBox.Show(this, ex.Message, "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                finally
                {
                    UseWaitCursor = false;
                }
            }
        }

        private void Log(string message)
        {
            _logTextBox.AppendText(DateTime.Now.ToString("HH:mm:ss") + "  " + message + Environment.NewLine);
        }
    }
}
