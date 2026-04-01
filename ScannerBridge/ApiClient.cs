using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;

namespace ScannerBridge
{
    internal sealed class ApiClient
    {
        private readonly JavaScriptSerializer _json = new JavaScriptSerializer();

        public LoginResult Login(string baseUrl, string operatorName, string password)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["operatorName"] = operatorName;
            payload["password"] = password;

            string responseBody = SendRequest(
                BuildUrl(baseUrl, "/api/admin/auth/login"),
                "POST",
                _json.Serialize(payload),
                null);

            Dictionary<string, object> response =
                _json.Deserialize<Dictionary<string, object> >(responseBody);

            string token = ReadString(response, "token");
            string resolvedOperatorName = ReadString(response, "operatorName");

            if (string.IsNullOrEmpty(token))
            {
                throw new ApplicationException("Login succeeded but no token was returned by the server.");
            }

            return new LoginResult(token, resolvedOperatorName);
        }

        public ScannerLoginResult LoginScanner(
            string baseUrl,
            string deviceId,
            string deviceName,
            string secret)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["deviceId"] = deviceId;
            payload["deviceName"] = deviceName;
            payload["secret"] = secret;

            string responseBody = SendRequest(
                BuildUrl(baseUrl, "/api/scanner/auth/login"),
                "POST",
                _json.Serialize(payload),
                null);

            return _json.Deserialize<ScannerLoginResult>(responseBody);
        }

        public MemberSummary[] ListMembers(string baseUrl, string token, string search)
        {
            string path = "/api/members";
            if (!string.IsNullOrEmpty(search))
            {
                path += "?search=" + Uri.EscapeDataString(search.Trim());
            }

            string responseBody = SendRequest(
                BuildUrl(baseUrl, path),
                "GET",
                null,
                token);

            MemberSummary[] response = _json.Deserialize<MemberSummary[]>(responseBody);
            return response ?? new MemberSummary[0];
        }

        public MemberBiometrics GetMemberBiometrics(string baseUrl, string token, string memberId)
        {
            string responseBody = SendRequest(
                BuildUrl(baseUrl, "/api/members/" + Uri.EscapeDataString(memberId) + "/biometrics"),
                "GET",
                null,
                token);

            return _json.Deserialize<MemberBiometrics>(responseBody);
        }

        public EnrollBiometricResult EnrollBiometric(
            string baseUrl,
            string token,
            string memberId,
            string fingerPosition,
            string templateBase64)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["fingerPosition"] = fingerPosition;
            payload["templateBase64"] = templateBase64;

            string responseBody = SendRequest(
                BuildUrl(baseUrl, "/api/members/" + Uri.EscapeDataString(memberId) + "/biometrics"),
                "POST",
                _json.Serialize(payload),
                token);

            return _json.Deserialize<EnrollBiometricResult>(responseBody);
        }

        public ScannerActiveSession GetActiveScannerSession(string baseUrl, string token)
        {
            string responseBody = SendRequest(
                BuildUrl(baseUrl, "/api/scanner/attendance/active-session"),
                "GET",
                null,
                token);

            return _json.Deserialize<ScannerActiveSession>(responseBody);
        }

        public MatchingCandidatesResponse GetMatchingCandidates(string baseUrl, string token)
        {
            string responseBody = SendRequest(
                BuildUrl(baseUrl, "/api/scanner/attendance/active-session/matching-candidates"),
                "GET",
                null,
                token);

            return _json.Deserialize<MatchingCandidatesResponse>(responseBody);
        }

        public AttendanceScanResult SubmitAttendanceScan(
            string baseUrl,
            string token,
            string sessionId,
            string memberId,
            string deviceId,
            double confidence)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["memberId"] = memberId;
            payload["deviceId"] = deviceId;
            payload["confidence"] = confidence;

            ApiResponse response = SendRequestWithStatus(
                BuildUrl(
                    baseUrl,
                    "/api/scanner/attendance/sessions/" +
                    Uri.EscapeDataString(sessionId) +
                    "/scan"),
                "POST",
                _json.Serialize(payload),
                token);

            AttendanceScanResult result =
                _json.Deserialize<AttendanceScanResult>(response.Body);

            if (result == null)
            {
                throw new ApplicationException("The attendance scan response was empty.");
            }

            if (response.StatusCode >= 200 && response.StatusCode < 300)
            {
                return result;
            }

            if (!string.IsNullOrEmpty(result.status))
            {
                return result;
            }

            throw new ApplicationException(ExtractMessage(response.Body));
        }

        private string SendRequest(string url, string method, string body, string token)
        {
            ApiResponse response = SendRequestWithStatus(url, method, body, token);

            if (response.StatusCode >= 200 && response.StatusCode < 300)
            {
                return response.Body;
            }

            if (!string.IsNullOrEmpty(response.Body))
            {
                throw new ApplicationException(ExtractMessage(response.Body));
            }

            throw new ApplicationException("The request failed with status code " + response.StatusCode + ".");
        }

        private ApiResponse SendRequestWithStatus(
            string url,
            string method,
            string body,
            string token)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = method;
            request.Accept = "application/json";

            if (!string.IsNullOrEmpty(token))
            {
                request.Headers[HttpRequestHeader.Authorization] = "Bearer " + token;
            }

            if (body != null)
            {
                request.ContentType = "application/json";
                byte[] bodyBytes = Encoding.UTF8.GetBytes(body);
                request.ContentLength = bodyBytes.Length;
                using (Stream requestStream = request.GetRequestStream())
                {
                    requestStream.Write(bodyBytes, 0, bodyBytes.Length);
                }
            }

            try
            {
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                using (Stream responseStream = response.GetResponseStream())
                using (StreamReader reader = new StreamReader(responseStream))
                {
                    return new ApiResponse((int)response.StatusCode, reader.ReadToEnd());
                }
            }
            catch (WebException ex)
            {
                HttpWebResponse response = ex.Response as HttpWebResponse;
                if (response != null)
                {
                    string responseBody = ReadErrorBody(ex);
                    return new ApiResponse((int)response.StatusCode, responseBody);
                }

                throw;
            }
        }

        private string ReadErrorBody(WebException ex)
        {
            if (ex.Response == null)
            {
                return string.Empty;
            }

            using (Stream responseStream = ex.Response.GetResponseStream())
            {
                if (responseStream == null)
                {
                    return string.Empty;
                }

                using (StreamReader reader = new StreamReader(responseStream))
                {
                    return reader.ReadToEnd();
                }
            }
        }

        private string ExtractMessage(string body)
        {
            try
            {
                Dictionary<string, object> response =
                    _json.Deserialize<Dictionary<string, object> >(body);
                string message = ReadString(response, "message");
                if (!string.IsNullOrEmpty(message))
                {
                    return message;
                }
            }
            catch
            {
            }

            return body;
        }

        private static string ReadString(Dictionary<string, object> data, string key)
        {
            object value;
            if (data.TryGetValue(key, out value) && value != null)
            {
                return Convert.ToString(value);
            }

            return string.Empty;
        }

        private static string BuildUrl(string baseUrl, string path)
        {
            string trimmedBaseUrl = baseUrl.Trim().TrimEnd('/');
            return trimmedBaseUrl + path;
        }
    }

    internal sealed class LoginResult
    {
        public LoginResult(string token, string operatorName)
        {
            Token = token;
            OperatorName = operatorName;
        }

        public string Token { get; private set; }
        public string OperatorName { get; private set; }
    }

    internal sealed class ApiResponse
    {
        public ApiResponse(int statusCode, string body)
        {
            StatusCode = statusCode;
            Body = body ?? string.Empty;
        }

        public int StatusCode { get; private set; }
        public string Body { get; private set; }
    }

    internal sealed class ScannerLoginResult
    {
        public string token { get; set; }
        public string deviceId { get; set; }
        public string deviceName { get; set; }
        public string expiresIn { get; set; }
    }

    internal sealed class ScannerActiveSession
    {
        public string id { get; set; }
        public string programName { get; set; }
        public string notes { get; set; }
        public string status { get; set; }
        public string startedAt { get; set; }
        public string startedBy { get; set; }
        public int eventCount { get; set; }
    }

    internal sealed class MatchingCandidateTemplate
    {
        public string id { get; set; }
        public string fingerPosition { get; set; }
        public int? qualityScore { get; set; }
        public string updatedAt { get; set; }
        public string templateBase64 { get; set; }
    }

    internal sealed class MatchingCandidate
    {
        public string memberId { get; set; }
        public string name { get; set; }
        public string biometricStatus { get; set; }
        public string phone { get; set; }
        public string email { get; set; }
        public DepartmentSummary department { get; set; }
        public bool alreadyMarked { get; set; }
        public string markedAt { get; set; }
        public MatchingCandidateTemplate[] templates { get; set; }
    }

    internal sealed class MatchingCandidatesResponse
    {
        public ScannerActiveSession session { get; set; }
        public int candidateCount { get; set; }
        public MatchingCandidate[] candidates { get; set; }
    }

    internal sealed class AttendanceScanMember
    {
        public string id { get; set; }
        public string name { get; set; }
        public string department { get; set; }
    }

    internal sealed class AttendanceScanResult
    {
        public string status { get; set; }
        public string message { get; set; }
        public string attendanceEventId { get; set; }
        public string markedAt { get; set; }
        public string occurredAt { get; set; }
        public AttendanceScanMember member { get; set; }
    }

    internal sealed class DepartmentSummary
    {
        public string id { get; set; }
        public string name { get; set; }
    }

    internal sealed class MemberSummary
    {
        public string id { get; set; }
        public string name { get; set; }
        public string phone { get; set; }
        public string email { get; set; }
        public string biometricStatus { get; set; }
        public int enrolledFingerCount { get; set; }
        public DepartmentSummary department { get; set; }
    }

    internal sealed class MemberBiometricTemplate
    {
        public string id { get; set; }
        public string fingerPosition { get; set; }
        public int? qualityScore { get; set; }
        public string createdAt { get; set; }
        public string updatedAt { get; set; }
    }

    internal sealed class MemberBiometrics
    {
        public string memberId { get; set; }
        public string biometricStatus { get; set; }
        public int enrolledFingerCount { get; set; }
        public MemberBiometricTemplate[] templates { get; set; }
    }

    internal sealed class EnrollBiometricResult
    {
        public string memberId { get; set; }
        public string biometricStatus { get; set; }
        public int enrolledFingerCount { get; set; }
        public bool enrollmentComplete { get; set; }
    }
}
