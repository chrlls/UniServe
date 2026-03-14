<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['items.menuItem.category', 'customer', 'cashier'])
            ->latest('ordered_at');

        // Customers can only see their own orders
        if ($request->user()->role === User::ROLE_CUSTOMER) {
            $query->where('customer_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        $orders = $query->get();

        return $this->successResponse([
            'orders' => OrderResource::collection($orders)->resolve(),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $order = $this->orderService->createOrder($user, $request->validated());

        return $this->successResponse([
            'order' => (new OrderResource($order))->resolve(),
        ], 'Order created successfully.', 201);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role === User::ROLE_CUSTOMER && $order->customer_id !== $user->id) {
            return $this->errorResponse(
                'You do not have permission to access this order.',
                ['order' => ['This order does not belong to you.']],
                403,
            );
        }

        $order->load(['items.menuItem.category', 'customer', 'cashier']);

        return $this->successResponse([
            'order' => (new OrderResource($order))->resolve(),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $order = $this->orderService->updateStatus($order, $request->validated('status'), $user);

        return $this->successResponse([
            'order' => (new OrderResource($order))->resolve(),
        ], 'Order status updated successfully.');
    }
}
