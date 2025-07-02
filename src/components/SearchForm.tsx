
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SearchForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || !fromDate || !toDate) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Aqui você colocará a URL do seu backend
      const response = await fetch('http://localhost:5000/executar-busca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_query: searchQuery.split(',').map(term => term.trim()),
          from_date: fromDate,
          to_date: toDate
        })
      });

      if (response.ok) {
        toast({
          title: "Busca Iniciada",
          description: "A busca foi iniciada com sucesso. Você receberá os resultados por e-mail.",
        });
        
        // Limpar formulário
        setSearchQuery('');
        setFromDate('');
        setToDate('');
      } else {
        throw new Error('Erro na requisição');
      }
    } catch (error) {
      toast({
        title: "Erro na Busca",
        description: "Ocorreu um erro ao executar a busca. Tente novamente.",
        variant: "destructive"
      });
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cpis-blue">
          <Search className="h-5 w-5" />
          Busca Manual no Diário Oficial
        </CardTitle>
        <CardDescription>
          Execute uma busca imediata nos arquivos do Diário Oficial do Estado de São Paulo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="searchQuery">
              Termos de Busca <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="searchQuery"
              placeholder="Digite os termos de busca separados por vírgula (ex: empresa, contrato, licitação)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-sm text-muted-foreground">
              Separe múltiplos termos com vírgulas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">
                Data Inicial <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toDate">
                Data Final <span className="text-red-500">*</span>
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-cpis-blue hover:bg-cpis-blue-dark"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando Busca...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Executar Busca
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
