import Testing
import Foundation

actor CounterActor {
  private var value: Int = 0
  func inc() { value += 1 }
  func get() -> Int { value }
}

struct ActorPerfResult: Codable {
  let messages: Int
  let seconds: Double
  let msgPerSec: Double
}

@Test func actor_throughput_budget() async throws {
  let messages = Int(ProcessInfo.processInfo.environment["ACTOR_BENCH_MESSAGES"] ?? "200000") ?? 200000
  let minMps = Double(ProcessInfo.processInfo.environment["ACTOR_MIN_MPS"] ?? "80000") ?? 80000

  let actor = CounterActor()
  let start = CFAbsoluteTimeGetCurrent()
  for _ in 0..<messages { await actor.inc() }
  let end = CFAbsoluteTimeGetCurrent()

  let seconds = end - start
  let mps = Double(messages) / max(seconds, 0.000001)

  let result = ActorPerfResult(messages: messages, seconds: seconds, msgPerSec: mps)
  let json = try JSONEncoder().encode(result)
  let fileManager = FileManager.default
  if !fileManager.fileExists(atPath: "reports") {
      try fileManager.createDirectory(atPath: "reports", withIntermediateDirectories: true)
  }
  let reportUrl = URL(fileURLWithPath: "reports/swift-actor-bench.json")
  try json.write(to: reportUrl)

  #expect(mps >= minMps, "Actor throughput below budget: \(mps) < \(minMps)")
}
