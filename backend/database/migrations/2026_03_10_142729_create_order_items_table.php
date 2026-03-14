<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('order_items')) {
            Schema::create('order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('menu_item_id')->constrained()->restrictOnDelete();
                $table->unsignedInteger('quantity');
                $table->decimal('unit_price', 10, 2);
                $table->decimal('line_total', 10, 2);
                $table->timestamps();
            });

            return;
        }

        // Repair path for partially created table from a failed prior migration run.
        if (! $this->foreignKeyExists('order_items', 'order_items_order_id_foreign')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->foreign('order_id')
                    ->references('id')
                    ->on('orders')
                    ->cascadeOnDelete();
            });
        }

        if (! $this->foreignKeyExists('order_items', 'order_items_menu_item_id_foreign')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->foreign('menu_item_id')
                    ->references('id')
                    ->on('menu_items')
                    ->restrictOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        $database = DB::getDatabaseName();

        if ($database === null) {
            return false;
        }

        $result = DB::selectOne(
            "SELECT 1
             FROM information_schema.table_constraints
             WHERE table_schema = ?
               AND table_name = ?
               AND constraint_name = ?
               AND constraint_type = 'FOREIGN KEY'
             LIMIT 1",
            [$database, $table, $constraint]
        );

        return $result !== null;
    }
};
