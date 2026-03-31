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

            string responseBody = SendJson(
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

        public string EnrollBiometric(
            string baseUrl,
            string token,
            string memberId,
            string fingerPosition,
            string templateBase64)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["fingerPosition"] = fingerPosition;
            payload["templateBase64"] = templateBase64;

            string responseBody = SendJson(
                BuildUrl(baseUrl, "/api/members/" + Uri.EscapeDataString(memberId) + "/biometrics"),
                "POST",
                _json.Serialize(payload),
                token);

            return responseBody;
        }

        private string SendJson(string url, string method, string body, string token)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = method;
            request.ContentType = "application/json";
            request.Accept = "application/json";

            if (!string.IsNullOrEmpty(token))
            {
                request.Headers[HttpRequestHeader.Authorization] = "Bearer " + token;
            }

            byte[] bodyBytes = Encoding.UTF8.GetBytes(body);
            request.ContentLength = bodyBytes.Length;
            using (Stream requestStream = request.GetRequestStream())
            {
                requestStream.Write(bodyBytes, 0, bodyBytes.Length);
            }

            try
            {
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                using (Stream responseStream = response.GetResponseStream())
                using (StreamReader reader = new StreamReader(responseStream))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (WebException ex)
            {
                string responseBody = ReadErrorBody(ex);
                if (!string.IsNullOrEmpty(responseBody))
                {
                    throw new ApplicationException(ExtractMessage(responseBody), ex);
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
}
