import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'ledger_screen.dart';
import 'add_expense_screen.dart';
import 'auth_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    final stats = await ApiService.fetchStats();
    setState(() {
      _stats = stats;
      _isLoading = false;
    });
  }

  void _handleLogout() {
    ApiService.logout();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const AuthScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final totalSpent = _stats?['total'] ?? 0;
    final budgetLimit = _stats?['budget_amount'] ?? 0;
    final remainingBudget = _stats?['remaining'] ?? 0;
    final budgetStatus = _stats?['budget_status'] ?? 'healthy';
    final alertMessage = _stats?['alert_message'];
    
    final categoryTotals = _stats?['category_totals'] as Map<String, dynamic>? ?? {};
    final categoryBudgets = _stats?['category_budgets'] as Map<String, dynamic>? ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: 'Logout',
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Text
              Text(
                'Hello, ${ApiService.currentUser?['username'] ?? 'User'} 👋',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // Alert Notification Message Banner
              if (alertMessage != null && alertMessage.toString().isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: budgetStatus == 'danger' ? Colors.red.shade100 : Colors.amber.shade100,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: budgetStatus == 'danger' ? Colors.red.shade300 : Colors.amber.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning, color: budgetStatus == 'danger' ? Colors.red : Colors.amber.shade900),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          alertMessage,
                          style: TextStyle(
                            color: budgetStatus == 'danger' ? Colors.red.shade900 : Colors.amber.shade900,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Card - Spent vs Remaining limits
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                color: const Color(0xFF4F46E5),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      const Text(
                        'Total Spent this Month',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${totalSpent.toLocaleString()}',
                        style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      Divider(color: Colors.white.withOpacity(0.3)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(
                            children: [
                              const Text('Budget Limit', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              const SizedBox(height: 4),
                              Text('₹${budgetLimit.toLocaleString()}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Column(
                            children: [
                              const Text('Remaining', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              const SizedBox(height: 4),
                              Text('₹${remainingBudget.toLocaleString()}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Categories Budget Section
              const Text(
                'Category Breakdown',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              
              if (categoryBudgets.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text('No category budgets configured.', style: TextStyle(color: Colors.grey)),
                  ),
                )
              else
                ...categoryBudgets.entries.map((entry) {
                  final cat = entry.key;
                  final budgetAmt = entry.value as num;
                  final spentAmt = categoryTotals[cat] ?? 0;
                  final double pct = budgetAmt > 0 ? (spentAmt / budgetAmt).clamp(0.0, 1.0) : 0.0;
                  
                  Color progressColor = Colors.green;
                  if (pct >= 1.0) {
                    progressColor = Colors.red;
                  } else if (pct >= 0.8) {
                    progressColor = Colors.amber;
                  }

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(cat, style: const TextStyle(fontWeight: FontWeight.w600)),
                            Text('₹$spentAmt of ₹$budgetAmt', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct,
                            backgroundColor: Colors.grey.shade200,
                            color: progressColor,
                            minHeight: 8,
                          ),
                        )
                      ],
                    ),
                  );
                }),
              const SizedBox(height: 20),

              // Quick Actions Row buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const LedgerScreen()),
                        ).then((_) => _loadDashboardData());
                      },
                      icon: const Icon(Icons.list),
                      label: const Text('Expenses Ledger'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const AddExpenseScreen()),
                        ).then((_) => _loadDashboardData());
                      },
                      icon: const Icon(Icons.add),
                      label: const Text('Add Expense'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Utility extension for readable numbers
extension NumFormat on num {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}
