"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Activity,
  Bell,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  HardDrive,
  Layers3,
  Link2,
  Search,
  Server,
  ShieldAlert,
  Siren,
  Workflow,
  ChevronRight,
  Download,
  Eye,
  Users,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const kpis = [
  { label: "Доступность СПК", value: "99.94%", target: "SLA ≥ 99.90%", ok: true, icon: Activity },
  { label: "Среднее время обработки", value: "1.7 c", target: "SLA ≤ 3.0 c", ok: true, icon: Clock3 },
  { label: "Тех. ошибки", value: "0.42%", target: "SLA ≤ 1.0%", ok: true, icon: ShieldAlert },
  { label: "Критические инциденты", value: "0", target: "28 дней без инцидентов", ok: true, icon: Siren },
];

const channels = [
  { name: "iFora", load: 760, latency: "2.6 c", techErrors: "0.8%", business: "4.2%", status: "warning" },
  { name: "Web", load: 520, latency: "1.3 c", techErrors: "0.2%", business: "2.6%", status: "ok" },
  { name: "Mobile", load: 690, latency: "1.6 c", techErrors: "0.3%", business: "2.9%", status: "ok" },
  { name: "Branch", load: 120, latency: "2.1 c", techErrors: "0.4%", business: "3.1%", status: "ok" },
];

const integrations = [
  { name: "НБКИ", availability: "97.8%", latency: "3.7 c", errors: "6.4%", owner: "Внешний сервис", status: "warning" },
  { name: "Diasoft", availability: "99.7%", latency: "1.2 c", errors: "0.5%", owner: "Интеграция", status: "ok" },
  { name: "EMSB", availability: "99.2%", latency: "1.8 c", errors: "1.3%", owner: "Шина", status: "warning" },
  { name: "Kafka", availability: "99.9%", latency: "0.2 c", errors: "0.1%", owner: "Инфраструктура", status: "ok" },
];

const alerts = [
  {
    id: "ALT-431",
    severity: "CRITICAL",
    title: "SLA: доля тех. ошибок по каналу iFora выше порога",
    source: "СПК / iFora",
    threshold: "> 1.0% в течение 15 мин",
    owner: "Команда СПК",
    action: "Проверить Grafana → Kibana trace",
    status: "open",
  },
  {
    id: "ALT-428",
    severity: "WARNING",
    title: "Рост ошибок интеграции НБКИ",
    source: "НБКИ",
    threshold: "> 5% за 10 мин",
    owner: "Внешний сервис / интеграции",
    action: "Эскалация владельцу интеграции",
    status: "open",
  },
  {
    id: "ALT-421",
    severity: "INFO",
    title: "Kafka consumer lag выше базового уровня",
    source: "Kafka",
    threshold: "> 300 сообщений",
    owner: "Инфраструктура",
    action: "Проверить lag и статус подключений",
    status: "monitoring",
  },
];

const savedSearchesL1 = [
  "Ошибки за последний час по типам",
  "Все записи по конкретной заявке/клиенту за период",
  "Ошибки интеграций НБКИ за период",
  "Ошибки Diasoft за период",
];

const savedSearchesL2 = [
  "Полный путь обработки по request_id / trace_id",
  "Latency breakdown по шагам",
  "Технические ошибки vs бизнес-отказы",
  "Ошибки инфраструктуры / Kafka / EMSB",
  "Выборка для выгрузки CSV / Excel разработчикам",
];

const incidentTemplates = [
  { field: "Время инцидента", required: true },
  { field: "Канал", required: true },
  { field: "Номер заявки / client_id", required: true },
  { field: "request_id / trace_id", required: true },
  { field: "Симптом", required: true },
  { field: "Где обнаружено", required: true },
  { field: "Скриншот / ссылка на дашборд", required: true },
  { field: "Предварительная классификация", required: true },
  { field: "Кому эскалировано", required: true },
];

const symptoms = [
  {
    symptom: "Рост длительности обработки по iFora, интеграции зеленые",
    where: "Grafana / Channels / iFora",
    escalate: "Команда СПК",
  },
  {
    symptom: "Массовые ошибки НБКИ",
    where: "Grafana / Integrations + Kibana search",
    escalate: "Владелец интеграции / внешний сервис",
  },
  {
    symptom: "Kafka lag и reconnect ошибки",
    where: "Kafka dashboard",
    escalate: "Инфраструктура / шина",
  },
  {
    symptom: "Высокая доля business reject без тех. ошибок",
    where: "Kibana / error category",
    escalate: "Бизнес / правила обработки",
  },
];

const traces = [
  {
    ts: "10:21:11",
    step: "Receive application",
    system: "SPK API",
    duration: "120 ms",
    status: "ok",
    id: "req-87X-201",
  },
  {
    ts: "10:21:12",
    step: "Send to NBKI",
    system: "Integration NBKI",
    duration: "2.9 s",
    status: "warning",
    id: "req-87X-201",
  },
  {
    ts: "10:21:15",
    step: "EMSB publish",
    system: "EMSB",
    duration: "210 ms",
    status: "ok",
    id: "req-87X-201",
  },
  {
    ts: "10:21:16",
    step: "Decision result",
    system: "SPK Core",
    duration: "130 ms",
    status: "ok",
    id: "req-87X-201",
  },
];

function statusTone(status: string) {
  if (status === "ok") return "bg-green-500/10 text-green-700 border-green-200";
  if (status === "warning") return "bg-amber-500/10 text-amber-700 border-amber-200";
  if (status === "critical") return "bg-red-500/10 text-red-700 border-red-200";
  return "bg-slate-500/10 text-slate-700 border-slate-200";
}

function severityTone(severity: string) {
  if (severity === "CRITICAL") return "destructive" as const;
  if (severity === "WARNING") return "secondary" as const;
  return "outline" as const;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl border bg-background p-2 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SpkMonitoringMockup() {
  const [role, setRole] = useState("L1");
  const [query, setQuery] = useState("request_id:req-87X-201");
  const [channelFilter, setChannelFilter] = useState("all");

  const visibleChannels = useMemo(() => {
    if (channelFilter === "all") return channels;
    return channels.filter((c) => c.name === channelFilter);
  }, [channelFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">SPK Observability Center</Badge>
                <Badge className="rounded-full px-3 py-1">SLA-Oriented Monitoring</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Мокап UI мониторинга СПК</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Единый интерфейс для 1-й и 2-й линии сопровождения: контроль SLA, диагностика инцидентов,
                мониторинг каналов и интеграций, трассировка заявок, фиксация критических событий и выгрузка данных.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Button variant="outline" className="justify-start rounded-2xl"><Eye className="mr-2 h-4 w-4" /> Read-only L1</Button>
              <Button variant="outline" className="justify-start rounded-2xl"><Search className="mr-2 h-4 w-4" /> Kibana</Button>
              <Button variant="outline" className="justify-start rounded-2xl"><BarChart3 className="mr-2 h-4 w-4" /> Grafana</Button>
              <Button variant="outline" className="justify-start rounded-2xl"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="rounded-3xl border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <div className="mt-2 text-3xl font-semibold">{item.value}</div>
                          <p className="mt-2 text-xs text-muted-foreground">{item.target}</p>
                        </div>
                        <div className={`rounded-2xl p-2 ${item.ok ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          <Icon className={`h-5 w-5 ${item.ok ? "text-green-700" : "text-red-700"}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Контур доступа</CardTitle>
              <CardDescription>Ролевой режим интерфейса</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">1-я линия</SelectItem>
                  <SelectItem value="L2">2-я линия</SelectItem>
                  <SelectItem value="Manager">Руководитель / SLA</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
                {role === "L1" && (
                  <div className="space-y-2">
                    <p className="font-medium">Read-only режим</p>
                    <p className="text-muted-foreground">Доступ к Grafana и преднастроенным поискам Kibana без доступа к БД и серверам.</p>
                  </div>
                )}
                {role === "L2" && (
                  <div className="space-y-2">
                    <p className="font-medium">Расширенная диагностика</p>
                    <p className="text-muted-foreground">Трассировка request_id / trace_id, экспорт логов, анализ root cause, фиксация критических событий.</p>
                  </div>
                )}
                {role === "Manager" && (
                  <div className="space-y-2">
                    <p className="font-medium">SLA и отчетность</p>
                    <p className="text-muted-foreground">Контроль порогов, статистика алертов, дни без критических инцидентов, сводка эскалаций.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl md:grid-cols-6">
            <TabsTrigger value="overview">Операционный обзор</TabsTrigger>
            <TabsTrigger value="integrations">Интеграции</TabsTrigger>
            <TabsTrigger value="alerts">Алерты / SLA</TabsTrigger>
            <TabsTrigger value="diagnostics">Диагностика</TabsTrigger>
            <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
            <TabsTrigger value="incidents">Инциденты</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SectionTitle icon={Gauge} title="Операционный дашборд 1-й линии" subtitle="Быстрый ответ на вопросы: СПК в штатном режиме? Где проблема? Кому эскалировать?" />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Каналы обработки</CardTitle>
                    <CardDescription>Нагрузка, latency, тех. ошибки и бизнес-отказы</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                      <SelectTrigger className="w-40 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все каналы</SelectItem>
                        {channels.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Канал</TableHead>
                        <TableHead>Нагрузка</TableHead>
                        <TableHead>Latency</TableHead>
                        <TableHead>Тех. ошибки</TableHead>
                        <TableHead>Бизнес-отказы</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleChannels.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.load} req/h</TableCell>
                          <TableCell>{c.latency}</TableCell>
                          <TableCell>{c.techErrors}</TableCell>
                          <TableCell>{c.business}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-full ${statusTone(c.status)}`}>{c.status === "ok" ? "Штатно" : "Требует внимания"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Состояние СПК за 3–5 минут</CardTitle>
                  <CardDescription>Краткий runbook для 1-й линии</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "1. Открыть операционный дашборд Grafana и проверить SLA KPI.",
                    "2. Проверить канал с деградацией: latency / tech errors / availability.",
                    "3. Сравнить состояние внешних интеграций и инфраструктуры.",
                    "4. При необходимости открыть сохраненный поиск Kibana по заявке или ошибкам за час.",
                    "5. Зафиксировать симптом и передать по матрице эскалации.",
                  ].map((step) => (
                    <div key={step} className="flex gap-3 rounded-2xl border p-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <SectionTitle icon={Link2} title="Мониторинг интеграций и инфраструктуры" subtitle="Разделение проблем СПК, внешних сервисов, Kafka и EMSB" />
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Интеграции</CardTitle>
                  <CardDescription>Доступность, latency, ошибки, владелец проблемы</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Система</TableHead>
                        <TableHead>Доступность</TableHead>
                        <TableHead>Latency</TableHead>
                        <TableHead>Ошибки</TableHead>
                        <TableHead>Ответственный</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrations.map((i) => (
                        <TableRow key={i.name}>
                          <TableCell className="font-medium">{i.name}</TableCell>
                          <TableCell>{i.availability}</TableCell>
                          <TableCell>{i.latency}</TableCell>
                          <TableCell>{i.errors}</TableCell>
                          <TableCell>{i.owner}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-full ${statusTone(i.status)}`}>{i.status === "ok" ? "OK" : "Деградация"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Kafka / EMSB</CardTitle>
                    <CardDescription>Ключевые инфраструктурные индикаторы</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-2xl border p-4">
                      <div className="mb-2 flex items-center justify-between"><span className="font-medium">Kafka consumer lag</span><span>182</span></div>
                      <Progress value={61} />
                    </div>
                    <div className="rounded-2xl border p-4">
                      <div className="mb-2 flex items-center justify-between"><span className="font-medium">Ошибки подключений</span><span>0.1%</span></div>
                      <Progress value={10} />
                    </div>
                    <div className="rounded-2xl border p-4">
                      <div className="mb-2 flex items-center justify-between"><span className="font-medium">EMSB publish failures</span><span>1.3%</span></div>
                      <Progress value={42} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Интерпретация</CardTitle>
                    <CardDescription>Как отличить источник проблемы</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="rounded-2xl border p-3">Высокий latency СПК при зеленых интеграциях → вероятна проблема в логике СПК.</div>
                    <div className="rounded-2xl border p-3">Рост ошибок НБКИ / Diasoft → эскалация владельцу интеграции.</div>
                    <div className="rounded-2xl border p-3">Рост lag / reconnect / publish failures → инфраструктура или шина.</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <SectionTitle icon={Bell} title="Алерты и SLA" subtitle="SLA-пороги, уровни критичности, получатели и действия по реагированию" />
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Активные алерты</CardTitle>
                  <CardDescription>Настроены по SLA-порогам Заказчика</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.map((a) => (
                    <div key={a.id} className="rounded-3xl border p-4">
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant={severityTone(a.severity)}>{a.severity}</Badge>
                            <span className="text-xs text-muted-foreground">{a.id}</span>
                          </div>
                          <h3 className="font-medium">{a.title}</h3>
                          <p className="text-sm text-muted-foreground">Источник: {a.source}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="rounded-2xl"><BarChart3 className="mr-2 h-4 w-4" /> Grafana</Button>
                          <Button variant="outline" className="rounded-2xl"><Search className="mr-2 h-4 w-4" /> Kibana</Button>
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3"><span className="text-muted-foreground">Порог</span><div className="font-medium">{a.threshold}</div></div>
                        <div className="rounded-2xl bg-slate-50 p-3"><span className="text-muted-foreground">Получатель</span><div className="font-medium">{a.owner}</div></div>
                        <div className="rounded-2xl bg-slate-50 p-3"><span className="text-muted-foreground">Действие</span><div className="font-medium">{a.action}</div></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>SLA контроль</CardTitle>
                  <CardDescription>Покрытие критериев приемки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center justify-between"><span>Availability</span><span className="font-medium">99.94%</span></div>
                    <Progress value={99} />
                    <p className="mt-2 text-xs text-muted-foreground">Порог: не ниже 99.90%</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center justify-between"><span>Processing time</span><span className="font-medium">1.7 c</span></div>
                    <Progress value={57} />
                    <p className="mt-2 text-xs text-muted-foreground">Порог: не выше 3.0 c</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center justify-between"><span>Success / tech errors</span><span className="font-medium">0.42%</span></div>
                    <Progress value={42} />
                    <p className="mt-2 text-xs text-muted-foreground">Порог: не выше 1.0%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <SectionTitle icon={Search} title="Диагностика и трассировка" subtitle="Kibana searches, request_id / trace_id, полный путь обработки заявки и экспорт для разработчиков" />
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Поиск по логам</CardTitle>
                  <CardDescription>Сохраненные запросы для L1 и расширенные сценарии для L2</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-2xl" />
                    <Button className="rounded-2xl"><Search className="mr-2 h-4 w-4" /> Найти</Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border p-4">
                      <div className="mb-3 flex items-center gap-2 font-medium"><Users className="h-4 w-4" /> 1-я линия</div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {savedSearchesL1.map((s) => <li key={s}>• {s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <div className="mb-3 flex items-center gap-2 font-medium"><Layers3 className="h-4 w-4" /> 2-я линия</div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {savedSearchesL2.map((s) => <li key={s}>• {s}</li>)}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Trace заявки</CardTitle>
                  <CardDescription>Полный путь обработки с возможностью перехода из алерта</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[380px] pr-4">
                    <div className="space-y-4">
                      {traces.map((t, idx) => (
                        <div key={`${t.ts}-${idx}`} className="flex gap-4 rounded-3xl border p-4">
                          <div className="flex flex-col items-center">
                            <div className={`rounded-full p-2 ${t.status === "ok" ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"}`}>
                              {t.status === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            </div>
                            {idx < traces.length - 1 && <div className="mt-2 h-12 w-px bg-slate-200" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="font-medium">{t.step}</div>
                                <div className="text-sm text-muted-foreground">{t.system} · request_id: {t.id}</div>
                              </div>
                              <div className="text-sm text-muted-foreground">{t.ts} · {t.duration}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" className="rounded-2xl"><ExternalLink className="mr-2 h-4 w-4" /> Из Grafana в Kibana</Button>
                    <Button variant="outline" className="rounded-2xl"><Download className="mr-2 h-4 w-4" /> Выгрузить CSV</Button>
                    <Button variant="outline" className="rounded-2xl"><FileText className="mr-2 h-4 w-4" /> Передать Dev</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="runbooks" className="space-y-6">
            <SectionTitle icon={Workflow} title="Runbooks, матрица эскалации и сценарии действий" subtitle="Полное покрытие процедур 1-й и 2-й линии" />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Симптом → где смотреть → эскалация</CardTitle>
                  <CardDescription>Таблица принятия решения для L1</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Симптом</TableHead>
                        <TableHead>Где смотреть</TableHead>
                        <TableHead>Эскалация</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {symptoms.map((s) => (
                        <TableRow key={s.symptom}>
                          <TableCell>{s.symptom}</TableCell>
                          <TableCell>{s.where}</TableCell>
                          <TableCell className="font-medium">{s.escalate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Процедуры 2-й линии</CardTitle>
                  <CardDescription>Формальный порядок анализа инцидента</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Открыть alert и проверить превышенный SLA-порог.",
                    "Перейти в связанный Grafana dashboard и сузить окно времени.",
                    "Открыть Kibana по request_id / trace_id или error category.",
                    "Восстановить полный путь обработки и определить точку деградации.",
                    "Классифицировать событие: technical / business / integration / infra.",
                    "Сформировать выгрузку логов и пакет данных для команды разработки.",
                    "При необходимости зарегистрировать критический инцидент.",
                  ].map((s) => (
                    <div key={s} className="flex items-start gap-3 rounded-2xl border p-3 text-sm">
                      <ChevronRight className="mt-0.5 h-4 w-4" />
                      <span>{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <SectionTitle icon={Siren} title="Критические инциденты и пакет передачи" subtitle="Фиксация событий, обязательные поля и подготовка данных для разработчиков" />
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Критическое событие</CardTitle>
                  <CardDescription>Формализованный контур учета</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 font-medium">Критерии</div>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Недоступность СПК ниже SLA</li>
                      <li>• Массовые тех. ошибки выше допустимого порога</li>
                      <li>• Потеря обработки / критическая деградация Kafka / EMSB</li>
                      <li>• Массовый сбой интеграции с влиянием на бизнес-процесс</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border p-4">
                      <div className="text-muted-foreground">critical_incidents_total</div>
                      <div className="mt-2 text-2xl font-semibold">4</div>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <div className="text-muted-foreground">Дней без критических</div>
                      <div className="mt-2 text-2xl font-semibold">28</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Шаблон инцидента и пакет в Dev</CardTitle>
                  <CardDescription>Поля, которые обязаны передаваться от L1/L2 дальше</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    {incidentTemplates.map((item) => (
                      <div key={item.field} className="rounded-2xl border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span>{item.field}</span>
                          {item.required && <Badge variant="destructive">Обязательно</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-3xl border bg-slate-50 p-4 text-sm">
                    <div className="mb-2 font-medium">Пакет для разработчиков</div>
                    <div className="grid gap-2 text-muted-foreground md:grid-cols-2">
                      <div>• request_id / trace_id</div>
                      <div>• номер заявки / client_id</div>
                      <div>• ссылка на dashboard и тайм-окно</div>
                      <div>• CSV / Excel выгрузка логов</div>
                      <div>• скриншоты алерта и тренда</div>
                      <div>• предварительный root cause</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {[
            { title: "Grafana dashboards", icon: BarChart3, text: "Операционный, интеграционный, Kafka/EMSB, SLA и error dashboards." },
            { title: "Kibana saved searches", icon: Search, text: "L1 quick searches и L2 deep diagnostics по request_id / trace_id." },
            { title: "Access model", icon: HardDrive, text: "Read-only для L1, расширенная диагностика для L2, без DB/SSH для L1." },
            { title: "Incident workflow", icon: Database, text: "L1 → L2 → Dev с фиксацией критических событий и экспортом материалов." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-3xl border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-medium">{item.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Покрытие требований</h3>
              <p className="text-sm text-muted-foreground">
                Мокап покрывает SLA monitoring, L1/L2 workflows, алерты, диагностику, интеграции, Kafka/EMSB, access model,
                трассировку заявки, инциденты и пакет передачи в разработку.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">L1</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">L2</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">SLA</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">Kafka</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">Kibana</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">Grafana</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );











}
