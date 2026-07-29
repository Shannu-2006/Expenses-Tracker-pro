import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Bind emulator localhost loopback host (10.0.2.2 points to host system on Android emulator)
  static const String baseUrl = 'http://10.0.2.2:5000/api';
  
  static String? token;
  static Map<String, dynamic>? currentUser;

  static Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Auth: User Registration
  static Future<Map<String, dynamic>> register(String username, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'email': email,
          'password': password,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Auth: User Login & Session Caching
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );
      
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        token = data['token'];
        currentUser = data['user'];
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get User Statistics (Spent, Budget, Alerts)
  static Future<Map<String, dynamic>> fetchStats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/stats'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'message': 'Failed to load statistics'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Get Expenses list
  static Future<List<dynamic>> fetchExpenses() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/expenses'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['expenses'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Add Transaction
  static Future<Map<String, dynamic>> addExpense(
    String name,
    int amount,
    String category,
    String date,
    String notes,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/expenses'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'amount': amount,
          'category': category,
          'date': date,
          'notes': notes,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Delete Transaction
  static Future<Map<String, dynamic>> deleteExpense(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/expenses/$id'),
        headers: _headers,
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Set Budget Targets
  static Future<Map<String, dynamic>> setBudget(int budget, String category) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/budgets'),
        headers: _headers,
        body: jsonEncode({
          'budget': budget,
          'budget_category': category,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Clear Session cache
  static void logout() {
    token = null;
    currentUser = null;
  }
}
