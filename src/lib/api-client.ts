// Utility para fazer requisições autenticadas à API
const API_BASE_URL = 'http://54.233.39.118';

interface ApiError {
  status: string;
  message: string;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro na requisição');
    }

    return data;
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async post(endpoint: string, data: unknown) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async put(endpoint: string, data: unknown) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async delete(endpoint: string, data?: unknown) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  // Métodos específicos para sua API
  async executarBusca(searchData: {
    search_query: string | string[];
    from_date: string;
    to_date: string;
  }) {
    return this.post('/executar-busca', searchData);
  }

  async getCronJobs() {
    return this.get('/cron');
  }

  async createCronJob(jobData: Record<string, unknown>) {
    return this.post('/cron', jobData);
  }

  async updateCronJob(jobData: Record<string, unknown>) {
    return this.put('/cron', jobData);
  }

  async deleteCronJob(id: number) {
    return this.delete('/cron', { id });
  }

  async getConfig() {
    return this.get('/config');
  }

  async updateConfig(configData: Record<string, unknown>) {
    return this.put('/config', configData);
  }

  async downloadRegistro() {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/registro`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      throw new Error('Erro ao baixar arquivo');
    }

    // Retorna o blob para download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'registro.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.put('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }
}

// Instância única do cliente API
export const apiClient = new ApiClient();

// Função helper para requisições autenticadas (mantém compatibilidade com código existente)
export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // Se o token expirou, redireciona para login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return response;
};

export default apiClient;
