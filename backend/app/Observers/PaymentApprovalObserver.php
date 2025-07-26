<?php

namespace App\Observers;

use App\Models\PaymentApproval;

class PaymentApprovalObserver
{
    /**
     * Handle the PaymentApproval "creating" event.
     */
    public function creating(PaymentApproval $paymentApproval): void
    {
        // Ensure dispense_id is always set
        if (empty($paymentApproval->dispense_id)) {
            $paymentApproval->dispense_id = 'DISP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }
        
        // Set created_by to approved_by if not set
        if (empty($paymentApproval->created_by) && !empty($paymentApproval->approved_by)) {
            $paymentApproval->created_by = $paymentApproval->approved_by;
        }
    }

    /**
     * Handle the PaymentApproval "created" event.
     */
    public function created(PaymentApproval $paymentApproval): void
    {
        // Verify dispense_id was saved
        if (empty($paymentApproval->dispense_id)) {
            // If still empty, update it
            $paymentApproval->update([
                'dispense_id' => 'DISP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT)
            ]);
        }
    }

    /**
     * Handle the PaymentApproval "updated" event.
     */
    public function updated(PaymentApproval $paymentApproval): void
    {
        //
    }

    /**
     * Handle the PaymentApproval "deleted" event.
     */
    public function deleted(PaymentApproval $paymentApproval): void
    {
        //
    }

    /**
     * Handle the PaymentApproval "restored" event.
     */
    public function restored(PaymentApproval $paymentApproval): void
    {
        //
    }

    /**
     * Handle the PaymentApproval "force deleted" event.
     */
    public function forceDeleted(PaymentApproval $paymentApproval): void
    {
        //
    }
}
