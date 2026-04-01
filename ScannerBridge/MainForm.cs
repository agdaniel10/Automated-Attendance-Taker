using System;
using System.Drawing;
using System.Media;
using System.Text;
using System.Windows.Forms;

namespace ScannerBridge
{
    public sealed class MainForm : Form
    {
        private static readonly string[] FingerPositions = new[]
        {
            "LEFT_THUMB",
            "LEFT_INDEX",
            "LEFT_MIDDLE",
            "RIGHT_THUMB",
            "RIGHT_INDEX",
            "RIGHT_MIDDLE"
        };

        private readonly ApiClient _apiClient = new ApiClient();
        private string _adminToken;
        private MemberSummary _selectedMember;
        private MemberBiometrics _selectedMemberBiometrics;

        private TextBox _baseUrlTextBox;
        private TextBox _operatorNameTextBox;
        private TextBox _passwordTextBox;
        private Label _loginStatusLabel;
        private Button _searchMembersButton;
        private TextBox _memberSearchTextBox;
        private ListView _memberResultsListView;
        private Label _selectedMemberNameLabel;
        private Label _selectedMemberMetaLabel;
        private TextBox _memberIdTextBox;
        private Label _biometricStatusValueLabel;
        private Label _enrolledCountValueLabel;
        private ListBox _templateListBox;
        private Button _refreshMemberButton;
        private ComboBox _fingerPositionComboBox;
        private Button _captureEnrollButton;
        private TextBox _logTextBox;
        private string _scannerToken;
        private ScannerActiveSession _activeScannerSession;
        private MatchingCandidatesResponse _matchingCandidatesResponse;
        private TextBox _scannerDeviceIdTextBox;
        private TextBox _scannerDeviceNameTextBox;
        private TextBox _scannerSecretTextBox;
        private Label _scannerLoginStatusLabel;
        private Button _scannerLoginButton;
        private Button _loadActiveSessionButton;
        private Button _loadCandidatesButton;
        private Button _scanAttendanceButton;
        private TextBox _activeSessionTextBox;
        private Label _matchingCandidatesCountValueLabel;
        private ListView _matchingCandidatesListView;
        private TextBox _attendanceResultTextBox;
        private Panel _attendanceSummaryPanel;
        private Label _attendanceSummaryTitleLabel;
        private Label _attendanceSummaryMessageLabel;
        private Label _attendanceSummaryMemberLabel;
        private Label _attendanceSummaryMetaLabel;

        public MainForm()
        {
            InitializeLayout();
            ClearAttendanceState();
            UpdateUiState();
        }

        private void InitializeLayout()
        {
            Rectangle workingArea = Screen.PrimaryScreen == null
                ? new Rectangle(0, 0, 1280, 1024)
                : Screen.PrimaryScreen.WorkingArea;
            int defaultWidth = Math.Max(1000, Math.Min(1200, workingArea.Width - 40));
            int defaultHeight = Math.Max(780, Math.Min(900, workingArea.Height - 40));

            Text = "Attendance Scanner Bridge";
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(defaultWidth, defaultHeight);
            MinimumSize = new Size(1000, 780);
            AutoScroll = true;
            AutoScrollMinSize = new Size(1240, 1120);

            Label titleLabel = new Label();
            titleLabel.Text = "Fingerprint Enrollment and Attendance Bridge";
            titleLabel.Font = new Font(Font.FontFamily, 14.0f, FontStyle.Bold);
            titleLabel.Location = new Point(16, 16);
            titleLabel.Size = new Size(520, 28);

            GroupBox loginGroup = new GroupBox();
            loginGroup.Text = "Backend Login";
            loginGroup.Location = new Point(16, 56);
            loginGroup.Size = new Size(1208, 132);

            Label baseUrlLabel = new Label();
            baseUrlLabel.Text = "API Base URL";
            baseUrlLabel.Location = new Point(16, 28);
            baseUrlLabel.Size = new Size(96, 20);

            _baseUrlTextBox = new TextBox();
            _baseUrlTextBox.Location = new Point(128, 24);
            _baseUrlTextBox.Size = new Size(320, 24);
            _baseUrlTextBox.Text = "http://localhost:5000";

            Label operatorLabel = new Label();
            operatorLabel.Text = "Operator Name";
            operatorLabel.Location = new Point(16, 64);
            operatorLabel.Size = new Size(96, 20);

            _operatorNameTextBox = new TextBox();
            _operatorNameTextBox.Location = new Point(128, 60);
            _operatorNameTextBox.Size = new Size(200, 24);
            _operatorNameTextBox.Text = "Admin Operator";

            Label passwordLabel = new Label();
            passwordLabel.Text = "Admin Password";
            passwordLabel.Location = new Point(16, 96);
            passwordLabel.Size = new Size(104, 20);

            _passwordTextBox = new TextBox();
            _passwordTextBox.Location = new Point(128, 92);
            _passwordTextBox.Size = new Size(200, 24);
            _passwordTextBox.UseSystemPasswordChar = true;

            Button loginButton = new Button();
            loginButton.Text = "Login";
            loginButton.Location = new Point(472, 24);
            loginButton.Size = new Size(116, 34);
            loginButton.Click += LoginButton_Click;

            _loginStatusLabel = new Label();
            _loginStatusLabel.Text = "Not logged in.";
            _loginStatusLabel.Location = new Point(472, 68);
            _loginStatusLabel.Size = new Size(704, 40);

            loginGroup.Controls.Add(baseUrlLabel);
            loginGroup.Controls.Add(_baseUrlTextBox);
            loginGroup.Controls.Add(operatorLabel);
            loginGroup.Controls.Add(_operatorNameTextBox);
            loginGroup.Controls.Add(passwordLabel);
            loginGroup.Controls.Add(_passwordTextBox);
            loginGroup.Controls.Add(loginButton);
            loginGroup.Controls.Add(_loginStatusLabel);

            GroupBox memberGroup = new GroupBox();
            memberGroup.Text = "Member Search";
            memberGroup.Location = new Point(16, 204);
            memberGroup.Size = new Size(560, 336);

            Label searchLabel = new Label();
            searchLabel.Text = "Name / Email / Phone";
            searchLabel.Location = new Point(16, 30);
            searchLabel.Size = new Size(120, 20);

            _memberSearchTextBox = new TextBox();
            _memberSearchTextBox.Location = new Point(144, 26);
            _memberSearchTextBox.Size = new Size(288, 24);
            _memberSearchTextBox.KeyDown += MemberSearchTextBox_KeyDown;

            _searchMembersButton = new Button();
            _searchMembersButton.Text = "Search";
            _searchMembersButton.Location = new Point(448, 24);
            _searchMembersButton.Size = new Size(96, 30);
            _searchMembersButton.Click += SearchMembersButton_Click;

            _memberResultsListView = new ListView();
            _memberResultsListView.Location = new Point(16, 70);
            _memberResultsListView.Size = new Size(528, 228);
            _memberResultsListView.View = View.Details;
            _memberResultsListView.FullRowSelect = true;
            _memberResultsListView.GridLines = true;
            _memberResultsListView.MultiSelect = false;
            _memberResultsListView.HideSelection = false;
            _memberResultsListView.Columns.Add("Name", 165);
            _memberResultsListView.Columns.Add("Department", 115);
            _memberResultsListView.Columns.Add("Status", 80);
            _memberResultsListView.Columns.Add("Fingers", 55);
            _memberResultsListView.Columns.Add("Phone", 105);
            _memberResultsListView.SelectedIndexChanged += MemberResultsListView_SelectedIndexChanged;

            Label memberHintLabel = new Label();
            memberHintLabel.Text = "Search by name, email, or phone. Select a member to load their biometric status.";
            memberHintLabel.Location = new Point(16, 304);
            memberHintLabel.Size = new Size(528, 20);

            memberGroup.Controls.Add(searchLabel);
            memberGroup.Controls.Add(_memberSearchTextBox);
            memberGroup.Controls.Add(_searchMembersButton);
            memberGroup.Controls.Add(_memberResultsListView);
            memberGroup.Controls.Add(memberHintLabel);

            GroupBox enrollmentGroup = new GroupBox();
            enrollmentGroup.Text = "Selected Member";
            enrollmentGroup.Location = new Point(592, 204);
            enrollmentGroup.Size = new Size(632, 336);

            _selectedMemberNameLabel = new Label();
            _selectedMemberNameLabel.Text = "No member selected";
            _selectedMemberNameLabel.Font = new Font(Font.FontFamily, 11.0f, FontStyle.Bold);
            _selectedMemberNameLabel.Location = new Point(16, 28);
            _selectedMemberNameLabel.Size = new Size(600, 24);

            _selectedMemberMetaLabel = new Label();
            _selectedMemberMetaLabel.Text = "Select a member from the search list to begin enrollment.";
            _selectedMemberMetaLabel.Location = new Point(16, 56);
            _selectedMemberMetaLabel.Size = new Size(600, 38);

            Label memberIdLabel = new Label();
            memberIdLabel.Text = "Member ID";
            memberIdLabel.Location = new Point(16, 102);
            memberIdLabel.Size = new Size(96, 20);

            _memberIdTextBox = new TextBox();
            _memberIdTextBox.Location = new Point(112, 98);
            _memberIdTextBox.Size = new Size(500, 24);
            _memberIdTextBox.ReadOnly = true;

            Label biometricStatusLabel = new Label();
            biometricStatusLabel.Text = "Biometric Status";
            biometricStatusLabel.Location = new Point(16, 138);
            biometricStatusLabel.Size = new Size(96, 20);

            _biometricStatusValueLabel = new Label();
            _biometricStatusValueLabel.Text = "-";
            _biometricStatusValueLabel.Location = new Point(120, 138);
            _biometricStatusValueLabel.Size = new Size(120, 20);

            Label enrolledCountLabel = new Label();
            enrolledCountLabel.Text = "Enrolled Fingers";
            enrolledCountLabel.Location = new Point(16, 166);
            enrolledCountLabel.Size = new Size(96, 20);

            _enrolledCountValueLabel = new Label();
            _enrolledCountValueLabel.Text = "0";
            _enrolledCountValueLabel.Location = new Point(120, 166);
            _enrolledCountValueLabel.Size = new Size(120, 20);

            Label fingerLabel = new Label();
            fingerLabel.Text = "Finger Position";
            fingerLabel.Location = new Point(280, 138);
            fingerLabel.Size = new Size(96, 20);

            _fingerPositionComboBox = new ComboBox();
            _fingerPositionComboBox.DropDownStyle = ComboBoxStyle.DropDownList;
            _fingerPositionComboBox.Location = new Point(400, 164);
            _fingerPositionComboBox.Size = new Size(212, 24);
            _fingerPositionComboBox.Items.AddRange(FingerPositions);
            _fingerPositionComboBox.SelectedIndex = 0;

            Label templatesLabel = new Label();
            templatesLabel.Text = "Enrolled Finger Templates";
            templatesLabel.Location = new Point(16, 204);
            templatesLabel.Size = new Size(180, 20);

            _templateListBox = new ListBox();
            _templateListBox.Location = new Point(16, 228);
            _templateListBox.Size = new Size(420, 82);

            _refreshMemberButton = new Button();
            _refreshMemberButton.Text = "Refresh Status";
            _refreshMemberButton.Location = new Point(452, 228);
            _refreshMemberButton.Size = new Size(160, 34);
            _refreshMemberButton.Click += RefreshMemberButton_Click;

            _captureEnrollButton = new Button();
            _captureEnrollButton.Text = "Capture and Enroll";
            _captureEnrollButton.Location = new Point(452, 276);
            _captureEnrollButton.Size = new Size(160, 34);
            _captureEnrollButton.Click += CaptureEnrollButton_Click;

            enrollmentGroup.Controls.Add(_selectedMemberNameLabel);
            enrollmentGroup.Controls.Add(_selectedMemberMetaLabel);
            enrollmentGroup.Controls.Add(memberIdLabel);
            enrollmentGroup.Controls.Add(_memberIdTextBox);
            enrollmentGroup.Controls.Add(biometricStatusLabel);
            enrollmentGroup.Controls.Add(_biometricStatusValueLabel);
            enrollmentGroup.Controls.Add(enrolledCountLabel);
            enrollmentGroup.Controls.Add(_enrolledCountValueLabel);
            enrollmentGroup.Controls.Add(fingerLabel);
            enrollmentGroup.Controls.Add(_fingerPositionComboBox);
            enrollmentGroup.Controls.Add(templatesLabel);
            enrollmentGroup.Controls.Add(_templateListBox);
            enrollmentGroup.Controls.Add(_refreshMemberButton);
            enrollmentGroup.Controls.Add(_captureEnrollButton);

            GroupBox attendanceGroup = new GroupBox();
            attendanceGroup.Text = "Scanner Attendance Matching";
            attendanceGroup.Location = new Point(16, 556);
            attendanceGroup.Size = new Size(1208, 344);

            Label scannerDeviceIdLabel = new Label();
            scannerDeviceIdLabel.Text = "Device ID";
            scannerDeviceIdLabel.Location = new Point(16, 32);
            scannerDeviceIdLabel.Size = new Size(76, 20);

            _scannerDeviceIdTextBox = new TextBox();
            _scannerDeviceIdTextBox.Location = new Point(96, 28);
            _scannerDeviceIdTextBox.Size = new Size(180, 24);
            _scannerDeviceIdTextBox.Text = Environment.MachineName.ToLowerInvariant();

            Label scannerDeviceNameLabel = new Label();
            scannerDeviceNameLabel.Text = "Device Name";
            scannerDeviceNameLabel.Location = new Point(296, 32);
            scannerDeviceNameLabel.Size = new Size(84, 20);

            _scannerDeviceNameTextBox = new TextBox();
            _scannerDeviceNameTextBox.Location = new Point(384, 28);
            _scannerDeviceNameTextBox.Size = new Size(190, 24);
            _scannerDeviceNameTextBox.Text = Environment.MachineName + " Scanner";

            Label scannerSecretLabel = new Label();
            scannerSecretLabel.Text = "Scanner Secret";
            scannerSecretLabel.Location = new Point(594, 32);
            scannerSecretLabel.Size = new Size(88, 20);

            _scannerSecretTextBox = new TextBox();
            _scannerSecretTextBox.Location = new Point(688, 28);
            _scannerSecretTextBox.Size = new Size(190, 24);
            _scannerSecretTextBox.UseSystemPasswordChar = true;

            _scannerLoginButton = new Button();
            _scannerLoginButton.Text = "Scanner Login";
            _scannerLoginButton.Location = new Point(896, 24);
            _scannerLoginButton.Size = new Size(128, 32);
            _scannerLoginButton.Click += ScannerLoginButton_Click;

            _scannerLoginStatusLabel = new Label();
            _scannerLoginStatusLabel.Text = "Scanner is not logged in.";
            _scannerLoginStatusLabel.Location = new Point(16, 64);
            _scannerLoginStatusLabel.Size = new Size(1176, 22);

            _loadActiveSessionButton = new Button();
            _loadActiveSessionButton.Text = "Load Active Session";
            _loadActiveSessionButton.Location = new Point(16, 96);
            _loadActiveSessionButton.Size = new Size(148, 32);
            _loadActiveSessionButton.Click += LoadActiveSessionButton_Click;

            _loadCandidatesButton = new Button();
            _loadCandidatesButton.Text = "Load Candidates";
            _loadCandidatesButton.Location = new Point(176, 96);
            _loadCandidatesButton.Size = new Size(132, 32);
            _loadCandidatesButton.Click += LoadCandidatesButton_Click;

            _scanAttendanceButton = new Button();
            _scanAttendanceButton.Text = "Scan and Mark Attendance";
            _scanAttendanceButton.Location = new Point(320, 96);
            _scanAttendanceButton.Size = new Size(188, 32);
            _scanAttendanceButton.Click += ScanAttendanceButton_Click;

            Label matchingCandidatesCountLabel = new Label();
            matchingCandidatesCountLabel.Text = "Loaded Candidates";
            matchingCandidatesCountLabel.Location = new Point(528, 102);
            matchingCandidatesCountLabel.Size = new Size(112, 20);

            _matchingCandidatesCountValueLabel = new Label();
            _matchingCandidatesCountValueLabel.Text = "0";
            _matchingCandidatesCountValueLabel.Location = new Point(648, 102);
            _matchingCandidatesCountValueLabel.Size = new Size(120, 20);

            Label activeSessionLabel = new Label();
            activeSessionLabel.Text = "Active Session";
            activeSessionLabel.Location = new Point(16, 140);
            activeSessionLabel.Size = new Size(120, 20);

            _activeSessionTextBox = new TextBox();
            _activeSessionTextBox.Location = new Point(16, 164);
            _activeSessionTextBox.Multiline = true;
            _activeSessionTextBox.ReadOnly = true;
            _activeSessionTextBox.ScrollBars = ScrollBars.Vertical;
            _activeSessionTextBox.Size = new Size(380, 78);

            Label matchingCandidatesLabel = new Label();
            matchingCandidatesLabel.Text = "Matching Candidates";
            matchingCandidatesLabel.Location = new Point(412, 140);
            matchingCandidatesLabel.Size = new Size(140, 20);

            _matchingCandidatesListView = new ListView();
            _matchingCandidatesListView.Location = new Point(412, 164);
            _matchingCandidatesListView.Size = new Size(388, 78);
            _matchingCandidatesListView.View = View.Details;
            _matchingCandidatesListView.FullRowSelect = true;
            _matchingCandidatesListView.GridLines = true;
            _matchingCandidatesListView.MultiSelect = false;
            _matchingCandidatesListView.HideSelection = false;
            _matchingCandidatesListView.Columns.Add("Name", 160);
            _matchingCandidatesListView.Columns.Add("Department", 105);
            _matchingCandidatesListView.Columns.Add("Fingers", 50);
            _matchingCandidatesListView.Columns.Add("Status", 70);

            Label attendanceResultLabel = new Label();
            attendanceResultLabel.Text = "Attendance Details";
            attendanceResultLabel.Location = new Point(816, 140);
            attendanceResultLabel.Size = new Size(160, 20);

            _attendanceResultTextBox = new TextBox();
            _attendanceResultTextBox.Location = new Point(816, 164);
            _attendanceResultTextBox.Multiline = true;
            _attendanceResultTextBox.ReadOnly = true;
            _attendanceResultTextBox.ScrollBars = ScrollBars.Vertical;
            _attendanceResultTextBox.Size = new Size(376, 78);

            _attendanceSummaryPanel = new Panel();
            _attendanceSummaryPanel.Location = new Point(16, 254);
            _attendanceSummaryPanel.Size = new Size(1176, 72);
            _attendanceSummaryPanel.BorderStyle = BorderStyle.FixedSingle;

            _attendanceSummaryTitleLabel = new Label();
            _attendanceSummaryTitleLabel.Location = new Point(16, 8);
            _attendanceSummaryTitleLabel.Size = new Size(360, 24);
            _attendanceSummaryTitleLabel.Font = new Font(Font.FontFamily, 12.0f, FontStyle.Bold);

            _attendanceSummaryMessageLabel = new Label();
            _attendanceSummaryMessageLabel.Location = new Point(16, 36);
            _attendanceSummaryMessageLabel.Size = new Size(520, 24);
            _attendanceSummaryMessageLabel.Font = new Font(Font.FontFamily, 9.5f, FontStyle.Regular);

            _attendanceSummaryMemberLabel = new Label();
            _attendanceSummaryMemberLabel.Location = new Point(560, 10);
            _attendanceSummaryMemberLabel.Size = new Size(310, 24);
            _attendanceSummaryMemberLabel.Font = new Font(Font.FontFamily, 11.0f, FontStyle.Bold);
            _attendanceSummaryMemberLabel.TextAlign = ContentAlignment.MiddleLeft;

            _attendanceSummaryMetaLabel = new Label();
            _attendanceSummaryMetaLabel.Location = new Point(560, 36);
            _attendanceSummaryMetaLabel.Size = new Size(600, 24);
            _attendanceSummaryMetaLabel.Font = new Font(Font.FontFamily, 9.0f, FontStyle.Regular);
            _attendanceSummaryMetaLabel.TextAlign = ContentAlignment.MiddleLeft;

            _attendanceSummaryPanel.Controls.Add(_attendanceSummaryTitleLabel);
            _attendanceSummaryPanel.Controls.Add(_attendanceSummaryMessageLabel);
            _attendanceSummaryPanel.Controls.Add(_attendanceSummaryMemberLabel);
            _attendanceSummaryPanel.Controls.Add(_attendanceSummaryMetaLabel);

            attendanceGroup.Controls.Add(scannerDeviceIdLabel);
            attendanceGroup.Controls.Add(_scannerDeviceIdTextBox);
            attendanceGroup.Controls.Add(scannerDeviceNameLabel);
            attendanceGroup.Controls.Add(_scannerDeviceNameTextBox);
            attendanceGroup.Controls.Add(scannerSecretLabel);
            attendanceGroup.Controls.Add(_scannerSecretTextBox);
            attendanceGroup.Controls.Add(_scannerLoginButton);
            attendanceGroup.Controls.Add(_scannerLoginStatusLabel);
            attendanceGroup.Controls.Add(_loadActiveSessionButton);
            attendanceGroup.Controls.Add(_loadCandidatesButton);
            attendanceGroup.Controls.Add(_scanAttendanceButton);
            attendanceGroup.Controls.Add(matchingCandidatesCountLabel);
            attendanceGroup.Controls.Add(_matchingCandidatesCountValueLabel);
            attendanceGroup.Controls.Add(activeSessionLabel);
            attendanceGroup.Controls.Add(_activeSessionTextBox);
            attendanceGroup.Controls.Add(matchingCandidatesLabel);
            attendanceGroup.Controls.Add(_matchingCandidatesListView);
            attendanceGroup.Controls.Add(attendanceResultLabel);
            attendanceGroup.Controls.Add(_attendanceResultTextBox);
            attendanceGroup.Controls.Add(_attendanceSummaryPanel);

            GroupBox logGroup = new GroupBox();
            logGroup.Text = "Activity Log";
            logGroup.Location = new Point(16, 916);
            logGroup.Size = new Size(1208, 188);

            _logTextBox = new TextBox();
            _logTextBox.Location = new Point(16, 24);
            _logTextBox.Multiline = true;
            _logTextBox.ReadOnly = true;
            _logTextBox.ScrollBars = ScrollBars.Vertical;
            _logTextBox.Size = new Size(1176, 148);

            logGroup.Controls.Add(_logTextBox);

            Controls.Add(titleLabel);
            Controls.Add(loginGroup);
            Controls.Add(memberGroup);
            Controls.Add(enrollmentGroup);
            Controls.Add(attendanceGroup);
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
                _loginStatusLabel.Text = "Logged in as " + result.OperatorName + ". You can now search and enroll members.";
                Log("Login successful for operator: " + result.OperatorName);
                UpdateUiState();
                SearchMembers(false);
            }
            catch (Exception ex)
            {
                _adminToken = null;
                _loginStatusLabel.Text = "Login failed.";
                Log("Login failed: " + ex.Message);
                UpdateUiState();
                MessageBox.Show(this, ex.Message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private void SearchMembersButton_Click(object sender, EventArgs e)
        {
            SearchMembers(true);
        }

        private void MemberSearchTextBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                e.Handled = true;
                e.SuppressKeyPress = true;
                SearchMembers(true);
            }
        }

        private void MemberResultsListView_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (_memberResultsListView.SelectedItems.Count == 0)
            {
                return;
            }

            ListViewItem selectedItem = _memberResultsListView.SelectedItems[0];
            MemberSummary member = selectedItem.Tag as MemberSummary;
            if (member == null)
            {
                return;
            }

            SetSelectedMember(member);
            RefreshSelectedMemberBiometrics(false);
        }

        private void RefreshMemberButton_Click(object sender, EventArgs e)
        {
            RefreshSelectedMemberBiometrics(true);
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
                MessageBox.Show(this, "Search and select a member first.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            string fingerPosition = Convert.ToString(_fingerPositionComboBox.SelectedItem);
            if (string.IsNullOrEmpty(fingerPosition))
            {
                MessageBox.Show(this, "Choose the finger position being enrolled.", "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (IsFingerAlreadyEnrolled(fingerPosition))
            {
                DialogResult replaceResult = MessageBox.Show(
                    this,
                    "This finger position already has an enrolled template. Continue and replace it?",
                    "Replace Existing Finger",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);

                if (replaceResult != DialogResult.Yes)
                {
                    return;
                }
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
                    EnrollBiometricResult result = _apiClient.EnrollBiometric(
                        _baseUrlTextBox.Text.Trim(),
                        _adminToken,
                        memberId,
                        fingerPosition,
                        templateBase64);

                    Log(
                        "Enrollment saved for member " + memberId +
                        " (" + fingerPosition + "). Status: " + result.biometricStatus +
                        ". Enrolled fingers: " + result.enrolledFingerCount + ".");

                    RefreshSelectedMemberBiometrics(false);
                    SearchMembers(false);

                    string successMessage = "Fingerprint enrolled successfully." +
                        Environment.NewLine +
                        Environment.NewLine +
                        "Status: " + result.biometricStatus +
                        Environment.NewLine +
                        "Enrolled fingers: " + result.enrolledFingerCount;

                    if (result.enrollmentComplete)
                    {
                        successMessage += Environment.NewLine + "Enrollment is now complete for this member.";
                    }

                    MessageBox.Show(this, successMessage, "Enroll Fingerprint", MessageBoxButtons.OK, MessageBoxIcon.Information);
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

        private void ScannerLoginButton_Click(object sender, EventArgs e)
        {
            string baseUrl = _baseUrlTextBox.Text.Trim();
            string deviceId = _scannerDeviceIdTextBox.Text.Trim();
            string deviceName = _scannerDeviceNameTextBox.Text.Trim();
            string secret = _scannerSecretTextBox.Text;

            if (string.IsNullOrEmpty(baseUrl))
            {
                MessageBox.Show(this, "Enter the API base URL first.", "Scanner Login", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(deviceId))
            {
                MessageBox.Show(this, "Enter a scanner device ID.", "Scanner Login", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(secret))
            {
                MessageBox.Show(this, "Enter the scanner shared secret.", "Scanner Login", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            UseWaitCursor = true;
            try
            {
                ScannerLoginResult result = _apiClient.LoginScanner(baseUrl, deviceId, deviceName, secret);
                _scannerToken = result.token;
                _scannerLoginStatusLabel.Text =
                    "Scanner logged in as " + SafeValue(result.deviceName, result.deviceId) +
                    " (" + SafeValue(result.deviceId, "no device id") + ").";
                Log("Scanner login successful for device: " + SafeValue(result.deviceName, result.deviceId) + ".");
                ClearAttendanceState();
                SetAttendanceSummaryNeutral(
                    "Scanner Ready",
                    "Scanner login succeeded. Load an active session to start matching.",
                    SafeValue(result.deviceName, result.deviceId),
                    "Device ID: " + SafeValue(result.deviceId, "-"));
                UpdateUiState();
                LoadMatchingCandidates(false);
            }
            catch (Exception ex)
            {
                _scannerToken = null;
                _scannerLoginStatusLabel.Text = "Scanner login failed.";
                ClearAttendanceState();
                SetAttendanceSummary(
                    "Scanner Login Failed",
                    ex.Message,
                    string.Empty,
                    "Check the scanner secret and backend connection.",
                    Color.FromArgb(255, 228, 228),
                    Color.FromArgb(143, 32, 32));
                Log("Scanner login failed: " + ex.Message);
                UpdateUiState();
                MessageBox.Show(this, ex.Message, "Scanner Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private void LoadActiveSessionButton_Click(object sender, EventArgs e)
        {
            LoadActiveSession(true);
        }

        private void LoadCandidatesButton_Click(object sender, EventArgs e)
        {
            LoadMatchingCandidates(true);
        }

        private void ScanAttendanceButton_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(_scannerToken))
            {
                MessageBox.Show(this, "Log the scanner in first.", "Attendance Matching", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if ((_matchingCandidatesResponse == null || _matchingCandidatesResponse.candidates == null || _matchingCandidatesResponse.candidates.Length == 0) &&
                !LoadMatchingCandidates(false))
            {
                MessageBox.Show(this, "Load the active session and matching candidates before scanning.", "Attendance Matching", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            MatchingCandidate[] candidates =
                _matchingCandidatesResponse == null || _matchingCandidatesResponse.candidates == null
                    ? new MatchingCandidate[0]
                    : _matchingCandidatesResponse.candidates;

            if (_activeScannerSession == null || string.IsNullOrEmpty(_activeScannerSession.id))
            {
                MessageBox.Show(this, "No active attendance session is loaded.", "Attendance Matching", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (candidates.Length == 0)
            {
                MessageBox.Show(this, "No enrolled attendance candidates were returned for the active session.", "Attendance Matching", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            using (AttendanceVerificationDialog dialog = new AttendanceVerificationDialog(candidates))
            {
                SetAttendanceSummary(
                    "Scanning Fingerprint",
                    "Place one registered finger on the reader and hold steady.",
                    string.Empty,
                    "Matching against " + candidates.Length + " attendance candidate(s).",
                    Color.FromArgb(220, 235, 252),
                    Color.FromArgb(24, 73, 128));
                DialogResult captureResult = dialog.ShowDialog(this);
                if (captureResult != DialogResult.OK)
                {
                    SetAttendanceSummaryNeutral(
                        "Scan Cancelled",
                        "Attendance verification was cancelled before a result was submitted.",
                        string.Empty,
                        "Ready for the next person.");
                    Log("Attendance verification was cancelled or did not complete.");
                    return;
                }

                UseWaitCursor = true;
                try
                {
                    string matchedMemberId =
                        dialog.MatchFound && dialog.MatchedCandidate != null
                            ? dialog.MatchedCandidate.memberId
                            : string.Empty;
                    double confidence = dialog.MatchFound ? dialog.Confidence : 0;

                    AttendanceScanResult result = _apiClient.SubmitAttendanceScan(
                        _baseUrlTextBox.Text.Trim(),
                        _scannerToken,
                        _activeScannerSession.id,
                        matchedMemberId,
                        _scannerDeviceIdTextBox.Text.Trim(),
                        confidence);

                    _attendanceResultTextBox.Text = BuildAttendanceResultText(dialog, result);
                    LoadMatchingCandidates(false);
                    ApplyAttendanceResultPresentation(dialog, result);
                    Log(BuildAttendanceLogLine(dialog, result));
                }
                catch (Exception ex)
                {
                    SetAttendanceSummary(
                        "Attendance Submission Failed",
                        ex.Message,
                        string.Empty,
                        "The fingerprint scan completed, but the backend did not accept the result.",
                        Color.FromArgb(255, 228, 228),
                        Color.FromArgb(143, 32, 32));
                    SystemSounds.Hand.Play();
                    Log("Attendance submission failed: " + ex.Message);
                    MessageBox.Show(this, ex.Message, "Attendance Matching", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                finally
                {
                    UseWaitCursor = false;
                }
            }
        }

        private bool LoadActiveSession(bool showMessages)
        {
            if (string.IsNullOrEmpty(_scannerToken))
            {
                if (showMessages)
                {
                    MessageBox.Show(this, "Log the scanner in first.", "Active Session", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                return false;
            }

            UseWaitCursor = true;
            try
            {
                ScannerActiveSession session = _apiClient.GetActiveScannerSession(
                    _baseUrlTextBox.Text.Trim(),
                    _scannerToken);

                ApplyActiveSession(session);
                _matchingCandidatesResponse = null;
                _matchingCandidatesCountValueLabel.Text = "0";
                _matchingCandidatesListView.Items.Clear();
                _attendanceResultTextBox.Text = string.Empty;
                SetAttendanceSummaryNeutral(
                    "Session Loaded",
                    "Active attendance session is ready. Load candidates or scan after candidates are available.",
                    SafeValue(session.programName, session.id),
                    "Started " + FormatDate(session.startedAt) + " by " + SafeValue(session.startedBy, "-"));
                Log("Loaded active attendance session: " + SafeValue(session.programName, session.id) + ".");
                UpdateUiState();
                return true;
            }
            catch (Exception ex)
            {
                ClearAttendanceState();
                if (IsNoActiveSessionMessage(ex.Message))
                {
                    _activeSessionTextBox.Text = "No active attendance session was found.";
                    SetAttendanceSummary(
                        "No Active Session",
                        "Start an attendance session in the backend before scanning.",
                        string.Empty,
                        "The scanner is online, but no session is open.",
                        Color.FromArgb(255, 243, 205),
                        Color.FromArgb(120, 80, 0));
                    Log("No active attendance session is available.");
                    if (showMessages)
                    {
                        MessageBox.Show(this, "No active attendance session was found.", "Active Session", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                }
                else
                {
                    SetAttendanceSummary(
                        "Session Load Failed",
                        ex.Message,
                        string.Empty,
                        "Check backend connectivity and try again.",
                        Color.FromArgb(255, 228, 228),
                        Color.FromArgb(143, 32, 32));
                    Log("Failed to load active session: " + ex.Message);
                    if (showMessages)
                    {
                        MessageBox.Show(this, ex.Message, "Active Session", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }

                UpdateUiState();
                return false;
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private bool LoadMatchingCandidates(bool showMessages)
        {
            if (string.IsNullOrEmpty(_scannerToken))
            {
                if (showMessages)
                {
                    MessageBox.Show(this, "Log the scanner in first.", "Matching Candidates", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                return false;
            }

            UseWaitCursor = true;
            try
            {
                MatchingCandidatesResponse response = _apiClient.GetMatchingCandidates(
                    _baseUrlTextBox.Text.Trim(),
                    _scannerToken);

                _matchingCandidatesResponse = response;
                ApplyActiveSession(response.session);
                PopulateMatchingCandidates(response);
                if (string.IsNullOrEmpty(_attendanceResultTextBox.Text))
                {
                    SetAttendanceSummaryNeutral(
                        "Ready to Scan",
                        response.candidateCount > 0
                            ? "Candidates are loaded. You can start fingerprint attendance now."
                            : "No enrolled candidates were returned for the active session.",
                        SafeValue(response.session == null ? string.Empty : response.session.programName, "No Session"),
                        "Loaded candidates: " + response.candidateCount);
                }

                Log(
                    "Loaded " + response.candidateCount +
                    " attendance candidate(s) for session " +
                    SafeValue(response.session == null ? string.Empty : response.session.programName, "Unknown Session") + ".");

                if (showMessages && response.candidateCount == 0)
                {
                    MessageBox.Show(this, "No enrolled candidates are available for the active session yet.", "Matching Candidates", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }

                UpdateUiState();
                return true;
            }
            catch (Exception ex)
            {
                ClearAttendanceState();

                if (IsNoActiveSessionMessage(ex.Message))
                {
                    _activeSessionTextBox.Text = "No active attendance session was found.";
                    SetAttendanceSummary(
                        "No Active Session",
                        "Start an attendance session in the backend before loading candidates.",
                        string.Empty,
                        "No active session was returned by the server.",
                        Color.FromArgb(255, 243, 205),
                        Color.FromArgb(120, 80, 0));
                    Log("Matching candidates could not be loaded because no active session exists.");
                    if (showMessages)
                    {
                        MessageBox.Show(this, "No active attendance session was found.", "Matching Candidates", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                }
                else
                {
                    SetAttendanceSummary(
                        "Candidate Load Failed",
                        ex.Message,
                        string.Empty,
                        "The scanner could not prepare matching data for attendance.",
                        Color.FromArgb(255, 228, 228),
                        Color.FromArgb(143, 32, 32));
                    Log("Failed to load matching candidates: " + ex.Message);
                    if (showMessages)
                    {
                        MessageBox.Show(this, ex.Message, "Matching Candidates", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }

                UpdateUiState();
                return false;
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private void SearchMembers(bool showMessages)
        {
            if (string.IsNullOrEmpty(_adminToken))
            {
                if (showMessages)
                {
                    MessageBox.Show(this, "Login first before searching for members.", "Member Search", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                return;
            }

            string search = _memberSearchTextBox.Text.Trim();
            string selectedMemberId = _selectedMember == null ? string.Empty : _selectedMember.id;

            UseWaitCursor = true;
            try
            {
                MemberSummary[] members = _apiClient.ListMembers(
                    _baseUrlTextBox.Text.Trim(),
                    _adminToken,
                    search);

                PopulateMemberResults(members, selectedMemberId);
                Log("Member search returned " + members.Length + " result(s).");

                if (showMessages && members.Length == 0)
                {
                    MessageBox.Show(this, "No members matched your search.", "Member Search", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                Log("Member search failed: " + ex.Message);
                if (showMessages)
                {
                    MessageBox.Show(this, ex.Message, "Member Search", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private void PopulateMemberResults(MemberSummary[] members, string selectedMemberId)
        {
            _memberResultsListView.BeginUpdate();
            try
            {
                _memberResultsListView.Items.Clear();

                for (int index = 0; index < members.Length; index++)
                {
                    MemberSummary member = members[index];
                    string departmentName = member.department == null ? "-" : member.department.name;

                    ListViewItem item = new ListViewItem(member.name ?? string.Empty);
                    item.SubItems.Add(departmentName ?? "-");
                    item.SubItems.Add(member.biometricStatus ?? "-");
                    item.SubItems.Add(member.enrolledFingerCount.ToString());
                    item.SubItems.Add(member.phone ?? string.Empty);
                    item.Tag = member;
                    _memberResultsListView.Items.Add(item);

                    if (!string.IsNullOrEmpty(selectedMemberId) && member.id == selectedMemberId)
                    {
                        item.Selected = true;
                        item.Focused = true;
                        item.EnsureVisible();
                    }
                }
            }
            finally
            {
                _memberResultsListView.EndUpdate();
            }

            if (_memberResultsListView.Items.Count == 1)
            {
                _memberResultsListView.Items[0].Selected = true;
                _memberResultsListView.Items[0].Focused = true;
                _memberResultsListView.Select();
            }
        }

        private void PopulateMatchingCandidates(MatchingCandidatesResponse response)
        {
            MatchingCandidate[] candidates =
                response == null || response.candidates == null
                    ? new MatchingCandidate[0]
                    : response.candidates;

            _matchingCandidatesListView.BeginUpdate();
            try
            {
                _matchingCandidatesListView.Items.Clear();

                for (int index = 0; index < candidates.Length; index++)
                {
                    MatchingCandidate candidate = candidates[index];
                    string departmentName =
                        candidate.department == null
                            ? "-"
                            : SafeValue(candidate.department.name, "-");
                    string templateCount =
                        candidate.templates == null
                            ? "0"
                            : candidate.templates.Length.ToString();
                    string attendanceStatus =
                        candidate.alreadyMarked
                            ? "Marked"
                            : "Pending";

                    ListViewItem item = new ListViewItem(SafeValue(candidate.name, candidate.memberId));
                    item.SubItems.Add(departmentName);
                    item.SubItems.Add(templateCount);
                    item.SubItems.Add(attendanceStatus);
                    item.Tag = candidate;
                    if (candidate.alreadyMarked)
                    {
                        item.BackColor = Color.FromArgb(255, 248, 230);
                        item.ForeColor = Color.FromArgb(120, 80, 0);
                    }
                    _matchingCandidatesListView.Items.Add(item);
                }
            }
            finally
            {
                _matchingCandidatesListView.EndUpdate();
            }

            _matchingCandidatesCountValueLabel.Text = candidates.Length.ToString();
        }

        private void ApplyActiveSession(ScannerActiveSession session)
        {
            _activeScannerSession = session;

            if (session == null)
            {
                _activeSessionTextBox.Text = "No active attendance session loaded.";
                return;
            }

            StringBuilder builder = new StringBuilder();
            builder.Append("Program: ").AppendLine(SafeValue(session.programName, "Unnamed Session"));
            builder.Append("Status: ").AppendLine(SafeValue(session.status, "-"));
            builder.Append("Started: ").AppendLine(FormatDate(session.startedAt));
            builder.Append("Started By: ").AppendLine(SafeValue(session.startedBy, "-"));
            builder.Append("Recorded Events: ").Append(session.eventCount);

            if (!string.IsNullOrEmpty(session.notes))
            {
                builder.AppendLine();
                builder.Append("Notes: ").Append(session.notes);
            }

            _activeSessionTextBox.Text = builder.ToString();
        }

        private void SetSelectedMember(MemberSummary member)
        {
            _selectedMember = member;
            _memberIdTextBox.Text = member.id ?? string.Empty;
            _selectedMemberNameLabel.Text = member.name ?? "Unnamed Member";
            _selectedMemberMetaLabel.Text = BuildMemberMetaText(member);
            _selectedMemberBiometrics = null;
            _biometricStatusValueLabel.Text = member.biometricStatus ?? "-";
            _enrolledCountValueLabel.Text = member.enrolledFingerCount.ToString();
            _templateListBox.Items.Clear();
            _templateListBox.Items.Add("Refreshing biometric details...");
            UpdateUiState();
            Log("Selected member: " + (member.name ?? member.id) + ".");
        }

        private void RefreshSelectedMemberBiometrics(bool showMessages)
        {
            if (string.IsNullOrEmpty(_adminToken))
            {
                if (showMessages)
                {
                    MessageBox.Show(this, "Login first before refreshing biometric details.", "Selected Member", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                return;
            }

            string memberId = _memberIdTextBox.Text.Trim();
            if (string.IsNullOrEmpty(memberId))
            {
                if (showMessages)
                {
                    MessageBox.Show(this, "Select a member first.", "Selected Member", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                return;
            }

            UseWaitCursor = true;
            try
            {
                _selectedMemberBiometrics = _apiClient.GetMemberBiometrics(
                    _baseUrlTextBox.Text.Trim(),
                    _adminToken,
                    memberId);

                ApplyBiometricDetails(_selectedMemberBiometrics);
                Log(
                    "Loaded biometric details for member " + memberId +
                    ". Status: " + _selectedMemberBiometrics.biometricStatus +
                    ". Enrolled fingers: " + _selectedMemberBiometrics.enrolledFingerCount + ".");
            }
            catch (Exception ex)
            {
                Log("Failed to load biometric details: " + ex.Message);
                if (showMessages)
                {
                    MessageBox.Show(this, ex.Message, "Selected Member", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            finally
            {
                UseWaitCursor = false;
            }
        }

        private void ApplyBiometricDetails(MemberBiometrics biometrics)
        {
            _biometricStatusValueLabel.Text = SafeValue(biometrics.biometricStatus, "-");
            _enrolledCountValueLabel.Text = biometrics.enrolledFingerCount.ToString();
            _templateListBox.Items.Clear();

            MemberBiometricTemplate[] templates = biometrics.templates ?? new MemberBiometricTemplate[0];
            if (templates.Length == 0)
            {
                _templateListBox.Items.Add("No fingerprints enrolled yet.");
            }
            else
            {
                for (int index = 0; index < templates.Length; index++)
                {
                    MemberBiometricTemplate template = templates[index];
                    _templateListBox.Items.Add(
                        template.fingerPosition + "  |  Enrolled " + FormatDate(template.createdAt));
                }
            }

            string nextFingerPosition = FindNextSuggestedFingerPosition(templates);
            if (!string.IsNullOrEmpty(nextFingerPosition))
            {
                _fingerPositionComboBox.SelectedItem = nextFingerPosition;
            }

            UpdateUiState();
        }

        private bool IsFingerAlreadyEnrolled(string fingerPosition)
        {
            if (_selectedMemberBiometrics == null || _selectedMemberBiometrics.templates == null)
            {
                return false;
            }

            for (int index = 0; index < _selectedMemberBiometrics.templates.Length; index++)
            {
                MemberBiometricTemplate template = _selectedMemberBiometrics.templates[index];
                if (template != null && string.Equals(template.fingerPosition, fingerPosition, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        private void ClearAttendanceState()
        {
            _activeScannerSession = null;
            _matchingCandidatesResponse = null;

            if (_activeSessionTextBox != null)
            {
                _activeSessionTextBox.Text = "No active attendance session loaded.";
            }

            if (_matchingCandidatesCountValueLabel != null)
            {
                _matchingCandidatesCountValueLabel.Text = "0";
            }

            if (_matchingCandidatesListView != null)
            {
                _matchingCandidatesListView.Items.Clear();
            }

            if (_attendanceResultTextBox != null)
            {
                _attendanceResultTextBox.Text = string.Empty;
            }

            SetAttendanceSummaryNeutral(
                "Ready for next scan",
                "Log the scanner in and load an active session to begin attendance.",
                string.Empty,
                "No attendance result yet.");
        }

        private static bool IsNoActiveSessionMessage(string message)
        {
            return !string.IsNullOrEmpty(message) &&
                message.IndexOf("No active attendance session", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private void ApplyAttendanceResultPresentation(
            AttendanceVerificationDialog dialog,
            AttendanceScanResult result)
        {
            string backendStatus = SafeValue(result == null ? string.Empty : result.status, string.Empty).ToLowerInvariant();
            string memberName =
                result != null && result.member != null
                    ? SafeValue(result.member.name, result.member.id)
                    : dialog.MatchFound && dialog.MatchedCandidate != null
                        ? SafeValue(dialog.MatchedCandidate.name, dialog.MatchedCandidate.memberId)
                        : "Unknown person";
            string memberDepartment =
                result != null && result.member != null
                    ? SafeValue(result.member.department, "No department")
                    : dialog.MatchFound && dialog.MatchedCandidate != null && dialog.MatchedCandidate.department != null
                        ? SafeValue(dialog.MatchedCandidate.department.name, "No department")
                        : "No department";
            string confidenceText =
                dialog.MatchFound
                    ? dialog.Confidence.ToString("0.0") + "% confidence"
                    : "No local fingerprint match";

            if (backendStatus == "present")
            {
                SetAttendanceSummary(
                    "Attendance Recorded",
                    SafeValue(result.message, "Attendance has been recorded successfully."),
                    memberName,
                    memberDepartment + " | " + confidenceText,
                    Color.FromArgb(216, 248, 223),
                    Color.FromArgb(24, 92, 48));
                SystemSounds.Asterisk.Play();
            }
            else if (backendStatus == "already_marked")
            {
                SetAttendanceSummary(
                    "Already Marked",
                    SafeValue(result.message, "Attendance was already recorded for this session."),
                    memberName,
                    memberDepartment + " | " + confidenceText,
                    Color.FromArgb(255, 243, 205),
                    Color.FromArgb(120, 80, 0));
                SystemSounds.Exclamation.Play();
            }
            else if (backendStatus == "member_not_enrolled")
            {
                SetAttendanceSummary(
                    "Enrollment Incomplete",
                    SafeValue(result.message, "This member has not completed fingerprint enrollment."),
                    memberName,
                    memberDepartment + " | Needs two enrolled fingers",
                    Color.FromArgb(255, 235, 205),
                    Color.FromArgb(128, 64, 0));
                SystemSounds.Exclamation.Play();
            }
            else if (backendStatus == "no_match" || !dialog.MatchFound)
            {
                SetAttendanceSummary(
                    "Fingerprint Not Recognized",
                    SafeValue(result == null ? string.Empty : result.message, "No enrolled fingerprint match was found."),
                    "No matched member",
                    SafeValue(dialog.ResultMessage, "Please ask an admin to approve manually."),
                    Color.FromArgb(255, 228, 228),
                    Color.FromArgb(143, 32, 32));
                SystemSounds.Hand.Play();
            }
            else
            {
                SetAttendanceSummary(
                    "Scan Completed",
                    SafeValue(result == null ? string.Empty : result.message, "Attendance scan completed."),
                    memberName,
                    memberDepartment + " | " + confidenceText,
                    Color.FromArgb(230, 236, 245),
                    Color.FromArgb(44, 62, 92));
                SystemSounds.Beep.Play();
            }

            HighlightMatchingCandidate(dialog.MatchFound && dialog.MatchedCandidate != null
                ? dialog.MatchedCandidate.memberId
                : string.Empty);
        }

        private void SetAttendanceSummaryNeutral(
            string title,
            string message,
            string member,
            string meta)
        {
            SetAttendanceSummary(
                title,
                message,
                member,
                meta,
                Color.FromArgb(235, 240, 245),
                Color.FromArgb(44, 62, 92));
        }

        private void SetAttendanceSummary(
            string title,
            string message,
            string member,
            string meta,
            Color backgroundColor,
            Color foregroundColor)
        {
            if (_attendanceSummaryPanel == null)
            {
                return;
            }

            _attendanceSummaryPanel.BackColor = backgroundColor;
            _attendanceSummaryTitleLabel.Text = SafeValue(title, string.Empty);
            _attendanceSummaryMessageLabel.Text = SafeValue(message, string.Empty);
            _attendanceSummaryMemberLabel.Text = SafeValue(member, string.Empty);
            _attendanceSummaryMetaLabel.Text = SafeValue(meta, string.Empty);

            _attendanceSummaryTitleLabel.ForeColor = foregroundColor;
            _attendanceSummaryMessageLabel.ForeColor = foregroundColor;
            _attendanceSummaryMemberLabel.ForeColor = foregroundColor;
            _attendanceSummaryMetaLabel.ForeColor = foregroundColor;
        }

        private void HighlightMatchingCandidate(string memberId)
        {
            if (_matchingCandidatesListView == null)
            {
                return;
            }

            _matchingCandidatesListView.BeginUpdate();
            try
            {
                for (int index = 0; index < _matchingCandidatesListView.Items.Count; index++)
                {
                    ListViewItem item = _matchingCandidatesListView.Items[index];
                    MatchingCandidate candidate = item.Tag as MatchingCandidate;
                    bool isMatch =
                        !string.IsNullOrEmpty(memberId) &&
                        candidate != null &&
                        string.Equals(candidate.memberId, memberId, StringComparison.OrdinalIgnoreCase);

                    item.Selected = isMatch;
                    item.BackColor = isMatch ? Color.FromArgb(216, 248, 223) : Color.White;
                    item.ForeColor = isMatch ? Color.FromArgb(24, 92, 48) : Color.Black;

                    if (isMatch)
                    {
                        item.Focused = true;
                        item.EnsureVisible();
                    }
                }
            }
            finally
            {
                _matchingCandidatesListView.EndUpdate();
            }
        }

        private string BuildAttendanceResultText(
            AttendanceVerificationDialog dialog,
            AttendanceScanResult result)
        {
            StringBuilder builder = new StringBuilder();
            builder.Append("Session: ")
                .AppendLine(
                    SafeValue(
                        _activeScannerSession == null ? string.Empty : _activeScannerSession.programName,
                        _activeScannerSession == null ? "No Session Loaded" : _activeScannerSession.id));
            builder.Append("Scanner Device: ")
                .AppendLine(SafeValue(_scannerDeviceNameTextBox.Text.Trim(), _scannerDeviceIdTextBox.Text.Trim()));
            builder.Append("Local Match: ")
                .AppendLine(dialog.MatchFound ? "Matched" : "No verified match");

            if (dialog.MatchFound && dialog.MatchedCandidate != null)
            {
                builder.Append("Matched Member: ")
                    .AppendLine(SafeValue(dialog.MatchedCandidate.name, dialog.MatchedCandidate.memberId));

                if (dialog.MatchedTemplate != null)
                {
                    builder.Append("Matched Finger: ")
                        .AppendLine(SafeValue(dialog.MatchedTemplate.fingerPosition, "-"));
                }

                builder.Append("Confidence: ")
                    .AppendLine(dialog.Confidence.ToString("0.0") + "%");
                builder.Append("FAR Achieved: ")
                    .AppendLine(dialog.MatchFarAchieved.ToString());
            }

            builder.Append("SDK Result: ")
                .AppendLine(SafeValue(dialog.ResultMessage, "-"));
            builder.Append("Backend Status: ")
                .AppendLine(SafeValue(result == null ? string.Empty : result.status, "-"));
            builder.Append("Backend Message: ")
                .AppendLine(SafeValue(result == null ? string.Empty : result.message, "-"));

            if (result != null && result.member != null)
            {
                builder.Append("Resolved Member: ")
                    .AppendLine(SafeValue(result.member.name, result.member.id));
                builder.Append("Department: ")
                    .AppendLine(SafeValue(result.member.department, "-"));
            }

            string recordedAt =
                result == null
                    ? string.Empty
                    : SafeValue(result.markedAt, result.occurredAt);

            if (!string.IsNullOrEmpty(recordedAt))
            {
                builder.Append("Recorded At: ")
                    .AppendLine(FormatDate(recordedAt));
            }

            return builder.ToString();
        }

        private string BuildAttendanceLogLine(
            AttendanceVerificationDialog dialog,
            AttendanceScanResult result)
        {
            if (result == null)
            {
                return "Attendance scan completed without a backend response.";
            }

            if (dialog.MatchFound && dialog.MatchedCandidate != null)
            {
                return
                    "Attendance scan matched " +
                    SafeValue(dialog.MatchedCandidate.name, dialog.MatchedCandidate.memberId) +
                    " at " + dialog.Confidence.ToString("0.0") +
                    "% confidence. Backend status: " +
                    SafeValue(result.status, "-") + ".";
            }

            return
                "Attendance scan produced no verified fingerprint match. Backend status: " +
                SafeValue(result.status, "-") + ".";
        }

        private string FindNextSuggestedFingerPosition(MemberBiometricTemplate[] templates)
        {
            for (int fingerIndex = 0; fingerIndex < FingerPositions.Length; fingerIndex++)
            {
                string fingerPosition = FingerPositions[fingerIndex];
                bool alreadyEnrolled = false;

                for (int templateIndex = 0; templateIndex < templates.Length; templateIndex++)
                {
                    MemberBiometricTemplate template = templates[templateIndex];
                    if (template != null &&
                        string.Equals(template.fingerPosition, fingerPosition, StringComparison.OrdinalIgnoreCase))
                    {
                        alreadyEnrolled = true;
                        break;
                    }
                }

                if (!alreadyEnrolled)
                {
                    return fingerPosition;
                }
            }

            return string.Empty;
        }

        private void UpdateUiState()
        {
            bool isLoggedIn = !string.IsNullOrEmpty(_adminToken);
            bool hasSelectedMember = !string.IsNullOrEmpty(_memberIdTextBox == null ? string.Empty : _memberIdTextBox.Text.Trim());
            bool isScannerLoggedIn = !string.IsNullOrEmpty(_scannerToken);
            bool hasActiveSession = _activeScannerSession != null && !string.IsNullOrEmpty(_activeScannerSession.id);
            bool hasMatchingCandidates =
                _matchingCandidatesResponse != null &&
                _matchingCandidatesResponse.candidates != null &&
                _matchingCandidatesResponse.candidates.Length > 0;

            if (_searchMembersButton != null)
            {
                _searchMembersButton.Enabled = isLoggedIn;
            }

            if (_refreshMemberButton != null)
            {
                _refreshMemberButton.Enabled = isLoggedIn && hasSelectedMember;
            }

            if (_captureEnrollButton != null)
            {
                _captureEnrollButton.Enabled = isLoggedIn && hasSelectedMember;
            }

            if (_scannerLoginButton != null)
            {
                _scannerLoginButton.Enabled = true;
            }

            if (_loadActiveSessionButton != null)
            {
                _loadActiveSessionButton.Enabled = isScannerLoggedIn;
            }

            if (_loadCandidatesButton != null)
            {
                _loadCandidatesButton.Enabled = isScannerLoggedIn;
            }

            if (_scanAttendanceButton != null)
            {
                _scanAttendanceButton.Enabled = isScannerLoggedIn && hasActiveSession && hasMatchingCandidates;
            }
        }

        private string BuildMemberMetaText(MemberSummary member)
        {
            string departmentName = member.department == null ? "No department" : SafeValue(member.department.name, "No department");
            string email = SafeValue(member.email, "No email");
            string phone = SafeValue(member.phone, "No phone");
            return departmentName + " | " + phone + Environment.NewLine + email;
        }

        private static string SafeValue(string value, string fallback)
        {
            if (string.IsNullOrEmpty(value))
            {
                return fallback;
            }

            return value;
        }

        private static string FormatDate(string value)
        {
            DateTime parsed;
            if (DateTime.TryParse(value, out parsed))
            {
                return parsed.ToString("yyyy-MM-dd HH:mm");
            }

            return value ?? "-";
        }

        private void Log(string message)
        {
            _logTextBox.AppendText(DateTime.Now.ToString("HH:mm:ss") + "  " + message + Environment.NewLine);
        }
    }
}
