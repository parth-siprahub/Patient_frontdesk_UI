const API_BASE_URL = "http://localhost:8000/api/v1";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("neuroassist_token");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ detail: "An error occurred" }));
        let errorMessage = "Request failed";

        if (typeof errorBody.detail === "string") {
            errorMessage = errorBody.detail;
        } else if (Array.isArray(errorBody.detail)) {
            // FastAPI 422 errors usually return a list of validation errors
            errorMessage = errorBody.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(", ");
        } else if (errorBody.detail && typeof errorBody.detail === "object") {
            errorMessage = JSON.stringify(errorBody.detail);
        } else if (errorBody.message) {
            errorMessage = errorBody.message;
        }

        throw new Error(errorMessage);
    }

    return response.json();
}
