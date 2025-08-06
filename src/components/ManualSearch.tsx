import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, CalendarIcon, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { TagInput } from "./TagInput";
import { authenticatedFetch } from "../lib/api-client";

interface SearchResult {
  status: string;
  resultados?: number;
  resultados_totais?: number;
  enviados?: number;
  excedentes?: number;
  message?: string;
}

interface ManualSearchProps {
  onSearchStart?: () => void;
  onSearchEnd?: () => void;
}

export function ManualSearch({ onSearchStart, onSearchEnd }: ManualSearchProps) {
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [emailEnvio, setEmailEnvio] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  // Definir data atual como padrão
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async () => {
    if (onSearchStart) onSearchStart();
    if (searchTags.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, adicione pelo menos um termo de busca",
        variant: "destructive"
      });
      return;
    }

    if (!fromDate || !toDate) {
      toast({
        title: "Erro", 
        description: "Por favor, selecione as datas",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await authenticatedFetch('/executar-busca', {
        method: 'POST',
        body: JSON.stringify({
          search_query: searchTags,
          from_date: fromDate,
          to_date: toDate,
          email_envio: emailEnvio
        })
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        if (data.status.includes("sucesso")) {
          toast({
            title: "Busca realizada com sucesso",
            description: `${data.resultados || data.resultados_totais || 0} resultado(s) encontrado(s)`
          });
        } else if (data.status.includes("limite")) {
          toast({
            title: "Busca realizada com limite",
            description: `${data.resultados_totais} resultados encontrados, ${data.enviados} enviados por email`,
            variant: "default"
          });
        } else if (data.status.includes("Nenhum resultado")) {
          toast({
            title: "Busca concluída",
            description: "Nenhum resultado encontrado para os termos pesquisados"
          });
        }
      } else {
        toast({
          title: "Erro na busca",
          description: data.message || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      if (onSearchEnd) onSearchEnd();
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    if (result.status.includes("sucesso") || result.status.includes("limite")) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    } else if (result.status.includes("Nenhum resultado")) {
      return <AlertCircle className="w-5 h-5 text-warning" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getResultColor = () => {
    if (!result) return "default";
    
    if (result.status.includes("sucesso") || result.status.includes("limite")) {
      return "default";
    } else if (result.status.includes("Nenhum resultado")) {
      return "secondary";
    } else {
      return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Busca Manual no Diário Oficial
          </CardTitle>
          <CardDescription>
            Execute uma busca imediata por termos específicos no Diário Oficial do Estado de São Paulo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search-query">Termos de Busca</Label>
            <TagInput
              tags={searchTags}
              onChange={setSearchTags}
              placeholder="Digite um termo e pressione Enter (ex: Companhia Paulista)"
              className="min-h-[80px]"
            />
            <p className="text-sm text-muted-foreground">
              Adicione um termo por vez. Pressione Enter ou vírgula para confirmar cada termo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Data Inicial
              </Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={today}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Data Final
              </Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                max={today}
                min={fromDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_envio">Email para Envio dos resultados</Label>
              <Input
                id="email_envio"
                type="email"
                value={emailEnvio}
                onChange={e => setEmailEnvio(e.target.value)}
              />
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando busca...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Executar Busca
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className="shadow-soft animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getResultIcon()}
              Resultado da Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge variant={getResultColor() as "default" | "destructive" | "outline" | "secondary"} className="text-sm">
                {result.status}
              </Badge>

              {result.resultados_totais !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {result.resultados_totais}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Encontrados
                    </div>
                  </div>

                  {result.enviados !== undefined && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-success">
                        {result.enviados}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Enviados por Email
                      </div>
                    </div>
                  )}

                  {result.excedentes !== undefined && result.excedentes > 0 && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-warning">
                        {result.excedentes}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Apenas Links
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.resultados !== undefined && (
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {result.resultados}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Resultados Encontrados
                  </div>
                </div>
              )}

              <div className="bg-accent/50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Status:</strong> {result.status}
                </p>
                {result.message && (
                  <p className="text-sm mt-2">
                    <strong>Detalhes:</strong> {result.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}