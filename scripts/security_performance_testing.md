# Security & Performance Testing Guide

## 1. Setting Up OWASP ZAP for Security Testing

### Option A: Desktop GUI
1. Download ZAP from https://www.zaproxy.org/download/
2. Install and launch ZAP.
3. By default, ZAP runs a proxy on 127.0.0.1:8080.
4. Configure your browser or application to use this proxy:
   - Chrome/Firefox: Settings > Proxy > Manual > HTTP/HTTPS: 127.0.0.1:8080
   - Or use ZAP's browser launch feature.
5. Visit your app (e.g., http://localhost:5173) and verify requests appear in ZAP's Sites/History panel.

### Option B: Docker
```sh
docker run -u zap -p 8080:8080 -i owasp/zap2docker-stable zap.sh -daemon -port 8080 -host 0.0.0.0
```

## 2. Performing Security Scans on Authentication and Data Access

1. Start ZAP and ensure your app traffic is being captured.
2. In ZAP, right-click your app's root node in the Sites tree and select 'Attack' > 'Spider...'.
   - Focus on login, registration, and data access endpoints.
   - Use ZAP's authentication features to log in as different user roles if needed.
3. After the Spider completes, right-click the same node and select 'Attack' > 'Active Scan...'.
   - Configure scan policy to prioritize authentication and data endpoints.
4. Monitor scan progress and review alerts in the Alerts tab.
5. Address findings such as:
   - Weak authentication
   - Improper access controls
   - Injection flaws
   - Sensitive data exposure
6. Document and remediate vulnerabilities as needed.

## 3. API Endpoint Security Testing

1. Export your OpenAPI/Swagger definition (e.g., openapi.json) from your backend or API gateway.
2. In ZAP, go to File > Import > OpenAPI Definition and select your openapi.json file.
3. ZAP will parse the API and add endpoints to the Sites tree.
4. Right-click the API root node and select 'Attack' > 'Active Scan...'.
   - Configure scan policy for API-specific checks (auth, input validation, etc).
5. For WebSocket APIs:
   - Ensure your app connects to the WebSocket while ZAP is proxying traffic.
   - Use ZAP's WebSocket tab to view and test messages.
6. Review alerts for vulnerabilities (improper authentication, authorization, input validation, etc).
7. Document and remediate findings as needed.

## 4. Setting Up k6 for Performance Testing

### Install k6
- Download from https://k6.io/docs/getting-started/installation/
- Or use Homebrew: `brew install k6`
- Or use Docker: `docker run -i loadimpact/k6 run -`

### Example k6 Script (save as k6_test.js)
```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:5173/api/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Run the test
```sh
k6 run k6_test.js
```

## 5. CI/CD Integration Tips
- Run ZAP in headless mode with scripts for automated scans.
- Run k6 as part of your pipeline and fail builds on performance regressions.
- Export ZAP/k6 reports for review.

---
For more details, see:
- ZAP: https://www.zaproxy.org/docs/
- k6: https://k6.io/docs/ 