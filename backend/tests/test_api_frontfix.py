import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestFrontFixEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_frontfix_health(self):
        response = self.client.get("/api/frontfix/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("knowledge_base_size", data)
        self.assertGreater(data["knowledge_base_size"], 0)

    def test_frontfix_presets(self):
        response = self.client.get("/api/presets")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("presets", data)
        self.assertIsInstance(data["presets"], list)

    def test_frontfix_knowledge(self):
        response = self.client.get("/api/knowledge")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_issues", data)
        self.assertGreater(data["total_issues"], 0)

    def test_frontfix_diagnose_valid_query(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "query": "TypeError: Cannot read properties of undefined (reading 'map')",
                "stack": "src/App.jsx:12",
                "framework": "react"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_frontfix_diagnose_exact_error_message(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "errorMessage": "Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n    at TaskList (TaskList.jsx:24:18)",
                "framework": {"name": "React", "version": "19"},
                "buildTool": "Vite",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        diag = data["data"]
        self.assertIn("likely_cause", diag)
        self.assertIn("fix_steps", diag)

    def test_frontfix_diagnose_with_framework_and_build_tool(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "query": "Uncaught ReferenceError: process is not defined",
                "framework": {"name": "React", "version": "19"},
                "buildTool": "Vite",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        evidence = data["data"].get("evidence_summary", {})
        self.assertEqual(evidence.get("detectedFramework"), "React")
        self.assertEqual(evidence.get("build_tool"), "Vite")

    def test_frontfix_diagnose_code_snippet(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "codeSnippet": "export default function TaskList({ tasks }) {\n  return <div>{tasks.map(t => <span key={t.id}>{t.title}</span>)}</div>;\n}",
                "filename": "TaskList.jsx",
                "codeLanguage": "jsx",
                "framework": {"name": "React", "version": "19"},
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

    def test_frontfix_skip_questions_best_guess(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "query": "Website not working",
                "action": "skip_questions",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertIn("data", data)
        self.assertIn("title", data["data"])
        self.assertIn("likely_cause", data["data"])

    def test_frontfix_diagnose_empty_query(self):
        response = self.client.post("/api/diagnose", json={"query": ""})
        self.assertEqual(response.status_code, 400)

    def test_frontfix_feedback(self):
        response = self.client.post(
            "/api/feedback",
            json={
                "issue_title": "React Map Error",
                "is_helpful": True,
                "comment": "Very clear explanation!"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_frontfix_diagnose_exact_error_message(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "errorMessage": "Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n    at TaskList (TaskList.jsx:24:18)",
                "framework": {"name": "React", "version": "19"},
                "buildTool": "Vite",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        diag = data["data"]
        self.assertIn("likely_cause", diag)
        self.assertIn("fix_steps", diag)

    def test_frontfix_diagnose_with_framework_and_build_tool(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "query": "Uncaught ReferenceError: process is not defined",
                "framework": {"name": "React", "version": "19"},
                "buildTool": "Vite",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        evidence = data["data"].get("evidence_summary", {})
        self.assertEqual(evidence.get("detectedFramework"), "React")
        self.assertEqual(evidence.get("build_tool"), "Vite")

    def test_frontfix_diagnose_code_snippet(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "codeSnippet": "export default function TaskList({ tasks }) {\n  return <div>{tasks.map(t => <span key={t.id}>{t.title}</span>)}</div>;\n}",
                "filename": "TaskList.jsx",
                "codeLanguage": "jsx",
                "framework": {"name": "React", "version": "19"},
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

    def test_frontfix_skip_questions_best_guess(self):
        response = self.client.post(
            "/api/diagnose",
            json={
                "query": "Website not working",
                "action": "skip_questions",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

        stats_res = self.client.get("/api/feedback/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.json()
        self.assertGreater(stats.get("total_feedback", 0), 0)

if __name__ == "__main__":
    unittest.main()
