#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

void printList(struct Node* head) {
    struct Node* current = head;
    printf("Attempting to print list:\n");
    
    while (current != NULL) {
        printf("%d -> ", current->data);
        current = current->next;
    }
    
    printf("NULL\n");
}

int main() {

    struct Node* head   = (struct Node*)malloc(sizeof(struct Node));
    struct Node* second = (struct Node*)malloc(sizeof(struct Node));
    struct Node* third  = (struct Node*)malloc(sizeof(struct Node));

    head->data = 10;
    head->next = second;

    second->data = 20;
    second->next = third;

    third->data = 30;
    
    // --- THIS IS THE BUG ---
    // Instead of setting the end of the list to NULL,
    // we create a cycle by pointing the 'third' node 
    // back to the 'second' node.
    third->next = second; 
    
    // 3. Call the print function.
    // This function will now loop forever: 10 -> 20 -> 30 -> 20 -> 30 -> ...
    printf("Calling printList...\n");
    printList(head);

    // This line will never be reached because of the infinite loop.
    printf("List printing complete.\n");

    // In a correct program, we would free the memory here.
    // free(head);
    // free(second);
    // free(third);

    return 0;
}