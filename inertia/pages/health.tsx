import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface HealthProps {
  isHealthy: boolean
  status: string
  finishedAt: string
  debugInfo: {
    pid: number
    ppid: number
    platform: string
    uptime: number
    version: string
  }
  checks: Array<{
    name: string
    isCached: boolean
    message: string
    status: 'ok' | 'warning' | 'error'
    finishedAt: string
    meta?: Record<string, any>
  }>
}

export default function HealthPage({ health }: { health: HealthProps }) {
  function getStatusIcon(status: string) {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-black" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-black" />
      case 'error':
        return <XCircle className="w-5 h-5 text-black" />
      default:
        return null
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ok':
        return 'bg-white border-black'
      case 'warning':
        return 'bg-gray-100 border-black'
      case 'error':
        return 'bg-gray-900 text-white border-black'
      default:
        return 'bg-white border-black'
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  function formatDate(value: string) {
    return format(new Date(value), 'd MMM yyyy H:mm', { locale: id })
  }

  const overallStatus = health.isHealthy ? 'Healthy' : 'Unhealthy'
  const statusBgColor = health.isHealthy ? 'bg-white' : 'bg-gray-900'
  const statusTextColor = health.isHealthy ? 'text-black' : 'text-white'

  return (
    <main className="hidden md:block min-h-screen">
      <div className="bg-white text-black min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">System Health Status</h1>
            <div
              className={`${statusBgColor} ${statusTextColor} border-2 border-black rounded-lg p-6 inline-block`}
            >
              <p className="text-sm font-mono uppercase mb-2">Overall Status</p>
              <p className="text-3xl font-bold">{overallStatus}</p>
            </div>
          </div>

          {/* Debug Info */}
          <div className="border-2 border-black rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-3">
              System Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="font-mono text-sm">
                <p className="font-bold mb-2">Process ID (PID)</p>
                <p className="text-lg">{health.debugInfo.pid}</p>
              </div>
              <div className="font-mono text-sm">
                <p className="font-bold mb-2">Parent PID (PPID)</p>
                <p className="text-lg">{health.debugInfo.ppid}</p>
              </div>
              <div className="font-mono text-sm">
                <p className="font-bold mb-2">Platform</p>
                <p className="text-lg">{health.debugInfo.platform}</p>
              </div>
              <div className="font-mono text-sm">
                <p className="font-bold mb-2">Version</p>
                <p className="text-lg">{health.debugInfo.version}</p>
              </div>
              <div className="font-mono text-sm col-span-2">
                <p className="font-bold mb-2">Uptime</p>
                <p className="text-lg">{health.debugInfo.uptime.toFixed(2)} seconds</p>
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-3">Health Checks</h2>
            <div className="space-y-4">
              {health.checks.map((check, index) => (
                <div
                  key={index}
                  className={`border-2 border-black rounded-lg p-6 ${getStatusColor(check.status)}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="pt-1">{getStatusIcon(check.status)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{check.name}</h3>
                      <p className="mb-3 text-sm">{check.message}</p>
                      <p className="text-xs font-mono opacity-70">{formatDate(check.finishedAt)}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 border border-black rounded font-mono text-sm font-bold ${
                          check.status === 'ok' ? 'bg-white' : 'bg-white text-black'
                        }`}
                      >
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Meta Info */}
                  {check.meta && (
                    <div className="bg-black/5 border-l-2 border-black pl-4 py-3 mt-4 text-sm font-mono">
                      <p className="font-bold mb-2">Details:</p>
                      {check.meta.sizeInPercentage && (
                        <div className="space-y-1">
                          <p>Used: {check.meta.sizeInPercentage.used}%</p>
                          <p>Warning Threshold: {check.meta.sizeInPercentage.warningThreshold}%</p>
                          <p>Failure Threshold: {check.meta.sizeInPercentage.failureThreshold}%</p>
                        </div>
                      )}
                      {check.meta.memoryInBytes && (
                        <div className="space-y-1">
                          <p>Used: {formatBytes(check.meta.memoryInBytes.used)}</p>
                          <p>Warning: {formatBytes(check.meta.memoryInBytes.warningThreshold)}</p>
                          <p>Failure: {formatBytes(check.meta.memoryInBytes.failureThreshold)}</p>
                        </div>
                      )}
                      {check.meta.error && (
                        <div className="space-y-1">
                          <p>Code: {check.meta.error.code}</p>
                          <p>
                            Address: {check.meta.error.address}:{check.meta.error.port}
                          </p>
                          <p>Syscall: {check.meta.error.syscall}</p>
                        </div>
                      )}
                      {check.meta.connection && (
                        <div className="space-y-1 mt-2">
                          <p>
                            Connection: {check.meta.connection.name} (
                            {check.meta.connection.dialect})
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs font-mono text-gray-600 mt-12 pt-6 border-t-2 border-black">
            <p>Last Updated: {formatDate(health.finishedAt)}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
