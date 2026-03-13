<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportRangeRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    public function salesSummary(ReportRangeRequest $request): JsonResponse
    {
        return $this->successResponse([
            'summary' => $this->reportService->salesSummary(
                $request->validated('start_date'),
                $request->validated('end_date'),
            ),
        ]);
    }

    public function bestSellingItems(ReportRangeRequest $request): JsonResponse
    {
        return $this->successResponse([
            'items' => $this->reportService->bestSellingItems(
                $request->validated('start_date'),
                $request->validated('end_date'),
            ),
        ]);
    }

    public function orderTrends(ReportRangeRequest $request): JsonResponse
    {
        return $this->successResponse([
            'trends' => $this->reportService->orderTrends(
                $request->validated('start_date'),
                $request->validated('end_date'),
            ),
        ]);
    }

    public function categoryBreakdown(ReportRangeRequest $request): JsonResponse
    {
        return $this->successResponse([
            'categories' => $this->reportService->categoryBreakdown(
                $request->validated('start_date'),
                $request->validated('end_date'),
            ),
        ]);
    }
}

