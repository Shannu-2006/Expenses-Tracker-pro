import 'package:flutter/material.dart';
import 'screens/auth_screen.dart';

void main() {
  runApp(const ExpenseTrackerApp());
}

class ExpenseTrackerApp extends StatelessWidget {
  const ExpenseTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Expense Tracker Pro',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          primary: const Color(0xFF4F46E5),
          secondary: const Color(0xFF6366F1),
        ),
        useMaterial3: true,
        fontFamily: 'Outfit',
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Color(0xFF4F46E5), width: 2.0),
          ),
          labelStyle: TextStyle(color: Color(0xFF4F46E5)),
        ),
      ),
      home: const AuthScreen(),
    );
  }
}
