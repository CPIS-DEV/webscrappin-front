
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, FileText, Clock } from 'lucide-react';
import SearchForm from './SearchForm';
import JobManager from './JobManager';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cpis-gray-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-cpis-blue rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema de Busca - Diário Oficial
                </h1>
                <p className="text-sm text-gray-600">CPIS - Gestão de Monitoramento</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Sistema Integrado</p>
                <p className="text-xs text-gray-500">Diário Oficial SP</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Busca Manual</CardTitle>
              <Search className="h-4 w-4 text-cpis-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cpis-blue">Disponível</div>
              <p className="text-xs text-muted-foreground">
                Execute buscas imediatas no sistema
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Agendados</CardTitle>
              <Calendar className="h-4 w-4 text-cpis-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cpis-blue">Ativos</div>
              <p className="text-xs text-muted-foreground">
                Monitoramento automático configurado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema</CardTitle>
              <Clock className="h-4 w-4 text-cpis-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                Todos os serviços funcionando
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Busca Manual
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jobs Agendados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Busca Manual no Diário Oficial
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Execute buscas imediatas nos arquivos do Diário Oficial do Estado de São Paulo. 
                Os resultados serão enviados automaticamente por e-mail.
              </p>
            </div>
            <SearchForm />
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-6">
            <JobManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-cpis-blue rounded flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-600">
                Sistema CPIS - Monitoramento Diário Oficial
              </span>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 CPIS. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
